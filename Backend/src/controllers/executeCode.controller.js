
import { db } from "../libs/db.js";
import { getLanguageName, pollBatchResults, submitBatch } from "../libs/judge0.lib.js";

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

        let allPassed = true;

        const detailedResult = results.map((result, i) => {
            const stdout = result.stdout 
                ? Buffer.from(result.stdout, 'base64').toString().trim()
                : null;
            const expected_output = expected_outputs[i]?.trim();

            // console.log(`Testcase: ${i + 1}`);
            // console.log(`Input: ${stdin[i]}`);
            // console.log(`Actual Output: ${stdout}`);
            // console.log(`Expected Output: ${expected_output}`);
            // console.log("Matched: ", stdout === expected_output);

            const passed = stdout === expected_output;
            if(!passed) allPassed = false;

            return {
                testcase: i + 1,
                passed,
                stdout,
                expected: expected_output,
                time: result.time ? `${result.time} s` : undefined,
                memory: result.memory ? `${result.memory} KB`: undefined,
                stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString().trim() : null,
                compile_output: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString().trim() : null,
                status: result.status.description
            };
        });

        console.log(detailedResult);

        const submission = await db.submission.create({
            data: {
                userId: req.user.id,
                problemId,
                sourceCode: source_code,
                language: getLanguageName(language_id),
                stdin: JSON.stringify(stdin),
                stdout: JSON.stringify(detailedResult.map(result => result.stdout)),
                stderr: JSON.stringify(detailedResult.some(r => r.stderr) ? detailedResult.map(r => r.stderr) : null),
                status: allPassed ? "Accepted" : "Wrong-Answer",
                memory: JSON.stringify(detailedResult.some(r => r.memory) ? detailedResult.map(r => r.memory) : null),
                time: JSON.stringify(detailedResult.some(r => r.time) ? detailedResult.map(r => r.time) : null),
                compileOutput: JSON.stringify(detailedResult.some(r => r.compile_output) ? detailedResult.map(r => r.compile_output) : null),
            }
        });

        // If allPassed = true => Mark problem as solved for current user
        if(allPassed) {
            await db.problemSolved.upsert({
                where: {
                    userId_problemId: {
                        userId: req.user.id,
                        problemId
                    }
                },
                update: {},
                create: {
                    userId: req.user.id,
                    problemId,
                }
            });
        }

        // 8. Save individual testcase results using detailedResult
        const testcaseResults = detailedResult.map((r, i) => ({
            submissionId: submission.id,
            testcase: r.testcase,
            passed: r.passed,
            stdout: r.stdout,
            expected: r.expected,
            stderr: r.stderr,
            compileOutput: r.compile_output,
            status: r.status,
            memory: r.memory,
            time: r.time
        }));

        await db.testcaseResult.createMany({
            data: testcaseResults
        });

        const submissionWithTestcase = await db.submission.findUnique({
            where: {
                id: submission.id,
            },
            include: {
                testcases: true
            }
        });
    
        res.status(200).json({
            message: "Code Executed Successfully!",
            data: submissionWithTestcase,
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: error.message || "Error executing code"});
    }
};

