import { pollBatchResults, submitBatch } from "../libs/judge0.lib.js";

export const executeCode = async (req, res) => {
    try {
        // 1. Get data from body and validate
        const {source_code, language_id, stdin, expected_outputs, problemId} = req.body;
        if(
            !source_code || !language_id ||
            !Array.isArray(stdin) || 
            stdin.length === 0 ||
            !Array.isArray(expected_outputs) ||
            expected_outputs.length !== stdin.length
        ) {
            return res.status(400).json({error: "Invalid or Missing testcases"});
        }

        // 2. Prepare each testcase for judge0 batch submission with proper base64 encoding
        const submissions = stdin.map((input, index) => ({
            source_code: Buffer.from(source_code).toString('base64'),
            language_id,
            stdin: Buffer.from(input).toString('base64'),
            // expected_output: Buffer.from(expected_outputs[index]).toString('base64')
        }));

        // 3. Send batch of submissions to judge0
        const submitResponse = await submitBatch(submissions);
        const tokens = submitResponse.map(({token}) => token);
    
        // 4. Poll judge0 for results of all submitted testcases
        const results = await pollBatchResults(tokens);
        console.log("Results---------", results);
    
        res.status(200).json({
            message: "Code Executed!"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.message || "Error executing code"});
    }
};