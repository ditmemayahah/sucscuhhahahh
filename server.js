const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
// Import the new prediction logic from thuatoan.js
const { generateRandomPrediction } = require('./thuatoan');

const app = express();
app.use(express.json());
const PORT = 3000;

// Cấu hình API và các hằng số
const API_URL = 'https://api.wsktnus8.net/v2/history/getLastResult?gameId=ktrng_3979&size=100&tableId=39791215743193&curPage=1';
const UPDATE_INTERVAL = 5000; // 5 giây
const HISTORY_FILE = path.join(__dirname, 'prediction_history.json');

let historyData = [];
let lastPrediction = {
    phien: null,
    du_doan: null,
    doan_vi: [],
    do_tin_cay: 0,
    reason: ""
};

// --- HÀM HỖ TRỢ ---

function loadPredictionHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('Lỗi đọc lịch sử dự đoán:', e.message);
    }
    return [];
}

function savePredictionHistory(data) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Lỗi lưu lịch sử dự đoán:', e.message);
    }
}

function appendPredictionHistory(record) {
    const all = loadPredictionHistory();
    all.push(record);
    savePredictionHistory(all);
}

async function updateHistory() {
    try {
        const res = await axios.get(API_URL);
        if (res?.data?.data?.resultList) {
            historyData = res.data.data.resultList;
            historyData = historyData.map(item => ({
                session: item.gameNum.replace('#', ''),
                result: getResultType(item),
                totalScore: item.score
            }));
        }
    } catch (e) {
        console.error('Lỗi cập nhật:', e.message);
    }
}

function getResultType(session) {
    if (!session || !session.facesList) return "";
    const [a, b, c] = session.facesList;
    if (a === b && b === c) return "Bão";
    return session.score >= 11 ? "Tài" : "Xỉu";
}

// --- CÁC ROUTE CỦA SERVER ---
app.post('/report-result', (req, res) => {
    const { phien, ket_qua_thuc } = req.body;
    if (!phien || !ket_qua_thuc) {
        return res.status(400).json({ error: "Thiếu phien hoặc ket_qua_thuc" });
    }

    const predHist = loadPredictionHistory();
    const lastPred = predHist.find(p => p.phien === phien);
    if (!lastPred) return res.status(404).json({ error: "Không tìm thấy dự đoán phiên này" });

    lastPred.ket_qua_thuc = ket_qua_thuc;
    savePredictionHistory(predHist);
    res.json({ success: true });
});

app.get('/predict', async (req, res) => {
    await updateHistory();
    const latest = historyData[0] || {};
    const currentPhien = latest.session;
    const nextPhien = currentPhien ? (parseInt(currentPhien) + 1).toString() : '1';

    if (currentPhien !== lastPrediction.phien) {
        // Use the new random prediction function
        const { prediction, doan_vi, do_tin_cay, reason } = generateRandomPrediction();

        lastPrediction = {
            phien: currentPhien,
            du_doan: prediction,
            doan_vi: doan_vi,
            do_tin_cay: do_tin_cay,
            reason: reason
        };

        appendPredictionHistory({
            phien: currentPhien,
            du_doan: prediction,
            doan_vi: doan_vi,
            do_tin_cay: do_tin_cay,
            reason: reason,
            ket_qua_thuc: null,
            timestamp: Date.now()
        });
    }

    const latestOriginal = (await axios.get(API_URL)).data.data.resultList[0];

    res.json({
        Phien: currentPhien,
        Xuc_xac_1: latestOriginal?.facesList?.[0] || 0,
        Xuc_xac_2: latestOriginal?.facesList?.[1] || 0,
        Xuc_xac_3: latestOriginal?.facesList?.[2] || 0,
        Tong: latestOriginal?.score || 0,
        Ket_qua: getResultType(latestOriginal),
        phien_hien_tai: nextPhien,
        du_doan: lastPrediction.du_doan,
        dudoan_vi: lastPrediction.doan_vi.join(", "),
        do_tin_cay: lastPrediction.do_tin_cay,
    });
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`🤖 Server AI dự đoán chạy tại http://localhost:${PORT}`);
    updateHistory();
    setInterval(updateHistory, UPDATE_INTERVAL);
});
