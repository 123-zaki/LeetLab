import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


export const getJudge0LanguageId = (language) => {
    const languageMap = {
        "PYTHON": "71",
        "JAVA": "62",
        "JAVASCRIPT": "63",
    }

    return languageMap[language.toUpperCase()];
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const pollBatchResults = async (tokens) => {
    while (true) {

        const options = {
            method: 'GET',
            url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
            params: {
                tokens: tokens.join(','),
                base64_encoded: 'true',
                fields: '*'
            },
            headers: {
                'x-rapidapi-key': 'b9da2d4da5mshb9887f79debceb6p1f9e81jsn2aab1f14671b',
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
            }
        };


        const { data } = await axios.request(options);

        const results = data.submissions;

        const isAllDone = results.every(
            (r) => r.status.id !== 1 && r.status.id !== 2
        )

        if (isAllDone) return results
        await sleep(1000)
    }
}

export const submitBatch = async (submissions) => {
    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'true'
        },
        headers: {
            'x-rapidapi-key': 'b9da2d4da5mshb9887f79debceb6p1f9e81jsn2aab1f14671b',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions
        }
    };


    const { data } = await axios.request(options);

    console.log("Submission Results: ", data)

    return data // [{token} , {token} , {token}]
}


export function getLanguageName(languageId) {
    const LANGUAGE_NAMES = {
        74: "TypeScript",
        63: "JavaScript",
        71: "Python",
        62: "Java",
    }

    return LANGUAGE_NAMES[languageId] || "Unknown"
}