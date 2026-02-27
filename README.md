# Flashback AI

## What is the project about?
Flashback AI is a fun, interactive web application that allows users to reimagine their photos in the style of different decades. Simply upload a photo, select the decades you want to travel to, and watch as the AI transforms your image with era-appropriate clothing, hairstyles, and photo quality.

### Features
- **Time Travel**: Transform your photos into various decades from the 1920s to the 2010s.
- **Batch Processing**: Select multiple decades at once and generate them simultaneously.
- **History Tracking**: Automatically saves your generated photos and sessions to your browser's local storage (IndexedDB) so you can revisit them later.
- **Album Download**: Download all your generated photos as a single, beautifully formatted collage album.
- **Rate Limiting**: Built-in rate limiting to prevent API abuse while keeping the user informed.
- **Responsive Design**: Works seamlessly on both desktop and mobile devices.

## Live Demo
Check out the live demo here: [https://flashback-ai.netlify.app](https://flashback-ai.netlify.app)

## How to setup the project locally?
1. Clone the repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install the dependencies by running:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add the required environment variables (see below).
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).

## Environment Variables
To run this project, you will need to add the following environment variables to your `.env` file:

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key.
- `VITE_MAX_PHOTOS`: Howmany photos user can generate in `VITE_LIMIT_MINUTES` minutes.
- `VITE_LIMIT_MINUTES`: In howmany minutes, user can generate maximum photos set with `VITE_MAX_PHOTOS`.

### How to get the Gemini API Key:
1. Go to Google AI Studio (https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on "Get API key" in the left sidebar.
4. Create a new API key or copy an existing one.
5. Add it to your `.env` file like this:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## How to deploy the project?
This project is configured for easy deployment on Netlify.

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Log in to your Netlify account.
3. Click "Add new site" -> "Import an existing project".
4. Choose your Git provider and authorize Netlify.
5. Select your repository.
6. Netlify will automatically detect the build settings from the `netlify.toml` file:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Show advanced" and add your `VITE_GEMINI_API_KEY` environment variable.
8. Click "Deploy site".

## How to test the project?
1. Start the local development server (`npm run dev`).
2. Open the app in your browser.
3. Upload a clear photo of a person.
4. Select a few decades (e.g., 1950s, 1980s).
5. Click "Generate" and verify that the images are created successfully.
6. Test the "History" feature by clicking the clock icon in the top right corner to ensure your previous sessions are saved.
7. Try downloading an individual image and the full album to ensure the download functionality works.
