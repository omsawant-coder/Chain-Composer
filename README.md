# Markov Chain Composer

Markov Chain Composer is a small Python web app and command-line program that
creates new text from a source `.txt` file. It learns which words follow one
another in the source, then uses those word-to-word transitions to compose a
new passage.

## Features

- Upload a UTF-8 `.txt` file in the web app.
- Choose a generated composition length from 1 to 1,000 words.
- View the generated text and its word, character, and generation-time stats.
- Copy or download the result as a text file.
- Run text generation from the command line.

## Screenshots

### Web app

![Markov Chain Composer web app](screenshots/composer-home.png)

### Generated composition

![Generated composition and statistics](screenshots/composition-result.png)

## Run the web app

From the project directory, install the dependencies and start the app:

```cmd
py -m pip install -r requirements.txt
py gui.py
```

Open <http://127.0.0.1:5000> in your browser. Upload a UTF-8 `.txt` file,
choose the number of words, and select **Generate Composition**. Use **Copy
Text** or **Download** to save the result.

## Run from the command line

```cmd
py project.py
```

When prompted, enter the path to a UTF-8 text file. The generated 100-word
composition is displayed and saved to `generated_output.txt` in the current
directory.

Only use source text that you have permission to process and share.

## Credits

YouTube Kylie Ying: https://www.youtube.com/ycubed  
Twitch Kylie Ying: https://www.twitch.tv/kylieying  
Twitter @kylieyying: https://twitter.com/kylieyying  
Instagram @kylieyying: https://www.instagram.com/kylieyying/  
Website: https://www.kylieying.com  
GitHub: https://www.github.com/kying18  
Programmer Beast Mode Spotify playlist: https://open.spotify.com/playlist/4Akns5EUb3gzmlXIdsJkPs?si=qGc4ubKRRYmPHAJAIrCxVQ
