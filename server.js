require('dotenv').config();


if (!process.env.YANDEX_API_KEY || !process.env.FOLDER_ID) {
  console.error("ERROR: Отсутствуют учетные данные Yandex Cloud!");
  process.exit(1);
}


const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const FOLDER_ID = process.env.FOLDER_ID;

async function getYandexGPTResponse(prompt) {
    try {
        const response = await axios.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                modelUri: `gpt://${FOLDER_ID}/yandexgpt-lite`,
                completionOptions: {
                    temperature: 0.6,
                    maxTokens: 1000
                },
                messages: [
                    {
                        role: "user",
                        text: prompt
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Api-Key ${YANDEX_API_KEY}`,
                    'x-folder-id': FOLDER_ID
                }
            }
        );
        return response.data.result.alternatives[0].message.text;
    } catch (error) {
        console.error("Ошибка API Yandex GPT:", error.response?.data || error.message);
        return "Извините, не могу обработать запрос. Ошибка сервера.";
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: 'Сообщение не может быть пустым' });
        }

        const gptResponse = await getYandexGPTResponse(userMessage);
        res.json({ response: gptResponse });
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});