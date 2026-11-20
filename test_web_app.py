from io import BytesIO

from gui import app


def test_home_page_loads():
    response = app.test_client().get("/")

    assert response.status_code == 200
    assert b"Markov Chain Composer" in response.data


def test_upload_generates_text_and_downloads_it():
    client = app.test_client()
    response = client.post(
        "/",
        data={
            "text_file": (BytesIO(b"hello world hello again"), "sample.txt"),
            "word_count": "4",
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert b"Generated text" in response.data

    download = client.post(
        "/download",
        data={"generated_text": "Hello world"},
    )
    assert download.status_code == 200
    assert download.data == b"Hello world"
    assert "attachment" in download.headers["Content-Disposition"]


def test_upload_rejects_invalid_word_count():
    response = app.test_client().post(
        "/",
        data={
            "text_file": (BytesIO(b"hello world"), "sample.txt"),
            "word_count": "1001",
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert b"Choose a word count between 1 and 1000." in response.data
