import string
import random
from graph import Graph

def get_words_from_text(text_path):
    with open(text_path, 'rb') as file:
        text = file.read().decode("utf-8") 

    return get_words_from_text_content(text)


def get_words_from_text_content(text):
    text = ' '.join(text.split())  # Remove extra whitespace
    text = text.lower()  # Convert to lowercase
    text = text.translate(str.maketrans('', '', string.punctuation))  # Remove punctuation
    words = text.split()

    words = words[:1000]

    return words

def make_graph(words):
    g = Graph()
    prev_word = None

    for word in words:
        word_vertex = g.get_vertex(word)

        if prev_word:
            prev_word.increment_edge(word_vertex)

        prev_word = word_vertex

    g.generate_probability_mappings()
    return g

def compose(g, words, length=50):
    if not words:
        raise ValueError("Cannot compose text from an empty word list.")

    word = g.get_vertex(random.choice(words))

    sentence_endings = [".", "!", "?"]
    sentence = ""

    for i in range(length):
        next_word = word.value

        # Capitalize the first word of the text or after sentence-ending punctuation
        if i == 0 or sentence.endswith(tuple(sentence_endings)):
            next_word = next_word.capitalize()

        sentence += next_word

        # Add a space or punctuation
        if (i + 1) % random.randint(8, 15) == 0:
            # Randomly end a sentence
            sentence += random.choice(sentence_endings) + " "
        else:
            sentence += " "

        if word.adjacent:
            word = g.get_next_word(word)
        else:
            word = g.get_vertex(random.choice(words))

    # Clean trailing space
    return sentence.strip()


def main():
    #  Step 1: Ask user for input text file path
    text_path = input("Enter the path to the input text file: ")

    #  Step 2: Load and clean words
    words = get_words_from_text(text_path)

    #  Step 3: Create graph and generate text
    g = make_graph(words)
    composition = compose(g, words, 100)
    output_text = composition

    #  Step 4: Display result
    print("\nGenerated Text:\n")
    print(output_text)

    #  Step 5: Save to file
    with open("generated_output.txt", "w", encoding="utf-8") as f:
        f.write(output_text)
    print("\n Output saved to 'generated_output.txt'")

if __name__ == '__main__':
    main()
