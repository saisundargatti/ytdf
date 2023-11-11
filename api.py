from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/download_transcript": {"origins": "http://127.0.0.1:5500"}})


def get_video_id(youtube_url):
    # Regular expression pattern to match various YouTube video URL formats
    patterns = [
        r'(?:https?://)?(?:www\.)?(?:youtube\.com)/watch\?v=([A-Za-z0-9_-]+)',
        r'(?:https?://)?(?:www\.)?(?:youtu\.be)/([A-Za-z0-9_-]+)',
        r'(?:https?://)?(?:www\.)?(?:youtube\.com)/embed/([A-Za-z0-9_-]+)',
        r'(?:https?://)?(?:www\.)?(?:youtube\.com)/v/([A-Za-z0-9_-]+)'
    ]

    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            video_id = match.group(1)
            return video_id

    return None

@app.route('/download_transcript', methods=["POST"])
def process_youtube_url():
    try:
        data = request.json
        youtube_url = data["youtubeURL"]
        if not youtube_url:
            return jsonify({'message': 'Missing or invalid "youtubeURL" field.'}), 400

        video_id = get_video_id(youtube_url)
        if video_id:
            # Check if the video has a transcript
            transcript = None
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
            except Exception:
                pass

            if transcript:
                # If a transcript is available, return it
                transcript_text = "\n".join(segment["text"] for segment in transcript)
                return jsonify({'message': 'Processed successfully', 'results': transcript_text})
            else:
                # If no transcript is available, return "No Transcript"
                return jsonify({'message': 'No Transcript'})
        else:
            return jsonify({'message': 'Invalid YouTube URL or video ID not found.'}), 400
    except Exception as e:
        return jsonify({'message': 'Error processing the request', 'error': str(e)}), 500


