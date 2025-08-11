import { getJudge0LanguageId, pollBatchResults, submitMatch } from "../libs/judge0.lib.js";

export const createProblem = async (req, res) => {
    // get all the data from req.body
    const {title, description, difficulty, examples, referenceSolutions, constraints, testcases, codeSnippets, tags} = req.body;

    // check the reole of user once again
    if(req.user.role !== 'ADMIN') {
        return  res.status(403).json({error: "You are not allowed to create a problem"});
    }

    try {
        // loop through each reference solutions for different languages
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
            const languageId = getJudge0LanguageId(language);
            if(!languageId) {
                return  res.status(400).json({
                    error: `Language ${language} is not supported`
                });
            }
    
            const submissions = testcases.map(({input, output}) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output
            }));
    
            const submissionResults = await submitMatch(submissions);
    
            const tokens = submissionResults.map((res) => res.token);
    
            const results = await pollBatchResults(tokens);
    
            for(let i = 0; i < results.length; i++) {
                if(results[i].status.id !== 3) {
                    return  res.status(400).json({
                        error: `Testcase ${i + 1} failed for language ${language}`
                    });
                }
            }
    
            const newProblem = await db.problem.create({
                data: {
                    title,
                    description,
                    testcases,
                    tags,
                    difficulty,
                    examples,
                    constraints,
                    codeSnippets,
                    referenceSolutions,
                    userId: req.user.id,
                }
            });
    
            return  res.status(201).json(newProblem);
        }
    } catch (error) {
        
    }
};

export const getAllProblems = async (req, res) => {};

export const getProblemById = async (req, res) => {};

export const updateProblem = async (req, res) => {};

export const deleteProblem = async (req, res) => {};

export const getAllProblemsSolvedByUser = async (req, res) => {};