import project
from project import get_words_from_text, make_graph, compose
from graph import Graph

def test_get_words_from_text(tmp_path):
    # Create a temporary text file
    file = tmp_path / "test.txt"
    file.write_text("Hello World! Hello CS50.")

    words = get_words_from_text(file)

    assert isinstance(words, list)
    assert "hello" in words
    assert "world" in words
    assert "cs50" in words


def test_make_graph():
    words = ["hello", "world", "hello"]
    g = make_graph(words)

    assert isinstance(g, Graph)
    assert g.get_vertex("hello") is not None
    assert g.get_vertex("world") is not None


def test_compose():
    words = ["hello", "world", "hello", "cs50"]
    g = make_graph(words)

    text = compose(g, words, length=20)

    assert isinstance(text, str)
    assert len(text) > 0


def test_compose_restarts_after_terminal_word(monkeypatch):
    words = ["hello", "world"]
    graph = make_graph(words)
    monkeypatch.setattr(project.random, "choice", lambda options: options[0])
    monkeypatch.setattr(project.random, "randint", lambda lower, upper: 100)

    text = compose(graph, words, length=4)

    assert text == "Hello world hello world"


def test_compose_rejects_empty_words():
    import pytest

    with pytest.raises(ValueError, match="empty word list"):
        compose(make_graph([]), [], length=1)
