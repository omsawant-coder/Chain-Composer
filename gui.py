from pathlib import Path
from time import perf_counter

from flask import Flask, make_response, render_template, request

from project import compose, get_words_from_text_content, make_graph


app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def index():
    error = None
    result = None
    word_count = request.form.get("word_count", "100")
    is_json = request.headers.get("X-Requested-With") == "XMLHttpRequest"
    generation_time_ms = None
    metrics = None
    transitions = None

    if request.method == "POST":
        uploaded_file = request.files.get("text_file")
        if uploaded_file is None or not uploaded_file.filename:
            error = "Choose a text file."
        elif Path(uploaded_file.filename).suffix.lower() != ".txt":
            error = "Upload a .txt file."
        else:
            try:
                count = int(word_count)
            except ValueError:
                error = "Enter a whole number of words."
            else:
                if not 1 <= count <= 1000:
                    error = "Choose a word count between 1 and 1000."
                else:
                    try:
                        text = uploaded_file.read().decode("utf-8")
                    except UnicodeDecodeError:
                        error = "The selected file must be valid UTF-8 text."
                    else:
                        words = get_words_from_text_content(text)
                        if not words:
                            error = "The selected file does not contain any words."
                        else:
                            started = perf_counter()
                            graph = make_graph(words)
                            result = compose(graph, words, length=count)
                            generation_time_ms = round((perf_counter() - started) * 1000)
                            unique_words = len(set(result.lower().replace(".", " ").replace("!", " ").replace("?", " ").split()))
                            metrics = {
                                "words": len(result.split()),
                                "characters": len(result),
                                "unique_words": unique_words,
                                "generation_time_ms": generation_time_ms,
                            }
                            transitions = {
                                vertex.value: [
                                    {
                                        "word": next_vertex.value,
                                        "weight": weight,
                                        "probability": round(
                                            weight / sum(v for v in vertex.adjacent.values()) * 100,
                                            1,
                                        ),
                                    }
                                    for next_vertex, weight in vertex.adjacent.items()
                                ]
                                for vertex in graph.vertices.values()
                            }

    if is_json:
        if error:
            return {"error": error}, 400
        if result is None:
            return {"error": "Choose a text file."}, 400
        return {
            "result": result,
            "metrics": metrics,
            "transitions": transitions,
        }

    response = make_response(
        render_template(
            "index.html",
            error=error,
            result=result,
            word_count=word_count,
            metrics=metrics,
            transitions=transitions,
        ),
        400 if error else 200,
    )
    return response


@app.post("/download")
def download():
    text = request.form.get("generated_text", "")
    if not text:
        return "There is no generated text to download.", 400

    response = make_response(text)
    response.headers["Content-Type"] = "text/plain; charset=utf-8"
    response.headers["Content-Disposition"] = (
        'attachment; filename="generated_output.txt"'
    )
    return response


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
