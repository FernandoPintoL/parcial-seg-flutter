<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test OpenAI Whisper</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }

        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }

        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }

        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }

        button {
            padding: 10px 20px;
            margin: 5px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }

        .btn-primary {
            background-color: #007bff;
            color: white;
        }

        .btn-success {
            background-color: #28a745;
            color: white;
        }

        .btn-danger {
            background-color: #dc3545;
            color: white;
        }

        .recording {
            background-color: #dc3545;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0% {
                opacity: 1;
            }

            50% {
                opacity: 0.5;
            }

            100% {
                opacity: 1;
            }
        }

        #audioTest {
            margin-top: 20px;
        }

        textarea {
            width: 100%;
            height: 100px;
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }

    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 Test OpenAI Whisper - Speech to Text</h1>

        <!-- API Connection Test -->
        <div class="test-section">
            <h2>1. Test API Connection</h2>
            <button onclick="testAPIConnection()" class="btn-primary">Test OpenAI API</button>
            <div id="apiStatus"></div>
        </div>

        <!-- Audio Recording Test -->
        <div class="test-section">
            <h2>2. Test Audio Recording & Transcription</h2>
            <div id="audioTest">
                <button id="recordBtn" onclick="toggleRecording()" class="btn-success">🎤 Start Recording</button>
                <div id="recordingStatus"></div>
                <div id="transcriptionResult"></div>
            </div>
        </div>

        <!-- Manual File Upload Test -->
        <div class="test-section">
            <h2>3. Test File Upload</h2>
            <input type="file" id="audioFile" accept="audio/*" />
            <button onclick="uploadAndTranscribe()" class="btn-primary">Upload & Transcribe</button>
            <div id="uploadResult"></div>
        </div>
    </div>

    <script>
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        let recordingTime = 0;
        let recordingTimer;

        // Test API Connection
        async function testAPIConnection() {
            const statusDiv = document.getElementById('apiStatus');
            statusDiv.innerHTML = '<div class="info">Testing connection...</div>';

            try {
                const response = await fetch('/api/speech/test-whisper');
                const result = await response.json();

                if (result.success) {
                    statusDiv.innerHTML = `
                        <div class="success">
                            <strong>✅ API Connection Successful!</strong><br>
                            API Key: ${result.data.api_key_configured ? '✅ Configured' : '❌ Not configured'}<br>
                            Whisper Model: ${result.data.whisper_available ? '✅ Available' : '❌ Not available'}
                        </div>
                    `;
                } else {
                    statusDiv.innerHTML = `<div class="error"><strong>❌ API Connection Failed:</strong> ${result.message}</div>`;
                }
            } catch (error) {
                statusDiv.innerHTML = `<div class="error"><strong>❌ Error:</strong> ${error.message}</div>`;
            }
        }

        // Audio Recording
        async function toggleRecording() {
            if (isRecording) {
                stopRecording();
            } else {
                await startRecording();
            }
        }

        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                recordingTime = 0;

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, {
                        type: 'audio/webm'
                    });
                    stream.getTracks().forEach(track => track.stop());
                    await transcribeAudio(audioBlob);
                };

                mediaRecorder.start();
                isRecording = true;

                const recordBtn = document.getElementById('recordBtn');
                recordBtn.textContent = '⏹️ Stop Recording';
                recordBtn.className = 'btn-danger recording';

                recordingTimer = setInterval(() => {
                    recordingTime++;
                    document.getElementById('recordingStatus').innerHTML =
                        `<div class="info">🔴 Recording... ${formatTime(recordingTime)}</div>`;
                }, 1000);

            } catch (error) {
                document.getElementById('recordingStatus').innerHTML =
                    `<div class="error">❌ Error accessing microphone: ${error.message}</div>`;
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                clearInterval(recordingTimer);

                const recordBtn = document.getElementById('recordBtn');
                recordBtn.textContent = '🎤 Start Recording';
                recordBtn.className = 'btn-success';

                document.getElementById('recordingStatus').innerHTML =
                    '<div class="info">🔄 Processing audio...</div>';
            }
        }

        async function transcribeAudio(audioBlob) {
            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('language', 'es');

                const response = await fetch('/api/speech/speech-to-text', {
                    method: 'POST'
                    , body: formData
                    , headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]') ? .getAttribute('content') || ''
                    , }
                , });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('transcriptionResult').innerHTML = `
                        <div class="success">
                            <strong>✅ Transcription Successful!</strong><br>
                            <strong>Text:</strong> ${result.data.text}<br>
                            <strong>Language:</strong> ${result.data.language}
                        </div>
                    `;
                } else {
                    document.getElementById('transcriptionResult').innerHTML = `
                        <div class="error"><strong>❌ Transcription Failed:</strong> ${result.message}</div>
                    `;
                }
            } catch (error) {
                document.getElementById('transcriptionResult').innerHTML = `
                    <div class="error"><strong>❌ Error:</strong> ${error.message}</div>
                `;
            }
        }

        // File Upload
        async function uploadAndTranscribe() {
            const fileInput = document.getElementById('audioFile');
            const file = fileInput.files[0];

            if (!file) {
                document.getElementById('uploadResult').innerHTML =
                    '<div class="error">❌ Please select an audio file</div>';
                return;
            }

            const formData = new FormData();
            formData.append('audio', file);
            formData.append('language', 'es');

            document.getElementById('uploadResult').innerHTML =
                '<div class="info">🔄 Processing file...</div>';

            try {
                const response = await fetch('/api/speech/speech-to-text', {
                    method: 'POST'
                    , body: formData
                    , headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]') ? .getAttribute('content') || ''
                    , }
                , });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('uploadResult').innerHTML = `
                        <div class="success">
                            <strong>✅ File Transcription Successful!</strong><br>
                            <strong>Text:</strong> ${result.data.text}<br>
                            <strong>Language:</strong> ${result.data.language}
                        </div>
                    `;
                } else {
                    document.getElementById('uploadResult').innerHTML = `
                        <div class="error"><strong>❌ Transcription Failed:</strong> ${result.message}</div>
                    `;
                }
            } catch (error) {
                document.getElementById('uploadResult').innerHTML = `
                    <div class="error"><strong>❌ Error:</strong> ${error.message}</div>
                `;
            }
        }

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        // Auto-test API connection on page load
        window.onload = function() {
            testAPIConnection();
        };

    </script>
</body>
</html>
