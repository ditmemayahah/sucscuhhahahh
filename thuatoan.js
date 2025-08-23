// thuatoan.js

function getRandomTaiXiu() {
    // Generate a random number to determine Tài/Xỉu/Bão
    const randomValue = Math.random();

    // Bão (triples) has a small probability
    if (randomValue < 0.15) { // 15% probability for Bão
        return "Bão";
    }

    // Tài (11-17) vs Xỉu (4-10) is a 50/50 split
    return Math.random() < 0.5 ? "Tài" : "Xỉu";
}

function getRandomVi(prediction) {
    const sums = [];
    let possibleSums = [];

    if (prediction === "Tài") {
        possibleSums = [11, 12, 13, 14, 15, 16, 17];
    } else if (prediction === "Xỉu") {
        possibleSums = [4, 5, 6, 7, 8, 9, 10];
    } else if (prediction === "Bão") {
        // Bão logic: sum is a triple, like 3+3+3=9, 4+4+4=12, etc.
        // We'll choose a random triple from 1 to 6
        const randomTriple = Math.floor(Math.random() * 6) + 1;
        possibleSums = [randomTriple * 3];
    } else {
        // Fallback for an unexpected prediction
        possibleSums = [7, 8, 9];
    }
    
    // Select 3 random sums from the possible sums, ensuring no duplicates
    while (sums.length < 3 && possibleSums.length > 0) {
        const randomIndex = Math.floor(Math.random() * possibleSums.length);
        const selectedSum = possibleSums.splice(randomIndex, 1)[0];
        sums.push(selectedSum);
    }

    return sums;
}

function generateRandomPrediction() {
    const du_doan = getRandomTaiXiu();
    const doan_vi = getRandomVi(du_doan);
    
    // Confidence is a random number between 61 and 97
    const do_tin_cay = (Math.random() * (97 - 61) + 61).toFixed(2);
    
    let reason;
    if (du_doan === "Bão") {
        reason = "Dự đoán bão dựa trên xác suất thấp.";
    } else {
        reason = "Dự đoán ngẫu nhiên dựa trên xác suất 50/50.";
    }
    
    return {
        prediction: du_doan,
        doan_vi: doan_vi,
        do_tin_cay: `${do_tin_cay}%`,
        reason: reason
    };
}

module.exports = {
    generateRandomPrediction
};
