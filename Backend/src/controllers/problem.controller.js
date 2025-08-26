import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../libs/judge0.lib.js";
import { db } from "../libs/db.js";

export const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  // going to check the user role once again

  try {
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);

      if (!languageId) {
        return res
          .status(400)
          .json({ error: `Language ${language} is not supported` });
      }

      //
      const submissions = testcases.map(({ input, output }) => ({
        source_code: Buffer.from(solutionCode).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(input).toString('base64'),
        expected_output: Buffer.from(output).toString('base64'),
      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map((res) => res.token);

      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log("Result-----", result);
        // console.log(
        //   `Testcase ${i + 1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
        // );
        if (result.status.id !== 3) {
          return res.status(400).json({
            error: `Testcase ${i + 1} failed for language ${language}`,
          });
        }
      }
    }

    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        referenceSolutions,
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      sucess: true,
      message: "Problem Created Successfully",
      problem: newProblem,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: "Error While Creating Problem",
    });
  }
};

export const getAllProblems = async (req, res) => {

  try {
    const problems = await db.problem.findMany();

    if (!problems) {
      return res.status(404).json({ error: "No Problem not found" })
    }

    res.status(200).json({
      success: true,
      problems,
      message: "Problems fetched successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || "Error while fetching problems" })
  }
};

export const getProblemById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Problem id is required" });
  }

  try {
    const problem = await db.problem.findUnique({
      where: {
        id
      }
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    res.status(200).json({
      success: true,
      message: "Problem fetched successfully",
      problem
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Error while fetching problem" });
  }
};

export const updateProblem = async (req, res) => {
  const {id} = req.params;
  if(req.user.role !== 'ADMIN') {
    return  res.status(403).json({error: "You are not allowed"});
  }

  try {
    const problem = await db.problem.findUnique({where: {id}});
    if(!problem) {
      return res.status(404).json({error: "Problem not found"});
    }

    if(problem.userId !== req.user.id) {
      return res.status(403).json({error: "Forbidden - This problem does not belongs to you"});
    }

    const {title, description, difficulty, tags, constraints, examples, codeSnippets, referenceSolutions, testcases} = req.body;

    if([tags, testcases, title, codeSnippets, referenceSolutions, examples, constraints, difficulty, description].every(field => field === undefined)) {
      return  res.status(400).json({error: "Updation data can not be empty"});
    }

    const updationData = {};

    if(tags)  updationData.tags = tags;
    if(testcases) updationData.testcases = testcases;
    if(description?.trim())  updationData.description = description;
    if(title?.trim())  updationData.title = title;
    if(difficulty?.trim())  updationData.difficulty = difficulty;
    if(constraints) updationData.constraints = constraints;
    if(examples)  updationData.examples = examples;
    if(codeSnippets)  updationData.codeSnippets = codeSnippets;
    if(referenceSolutions)  updationData.referenceSolutions = referenceSolutions;

    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);
      if(!languageId) {
        return res.status(400).json({
          error: `Language ${language} is not supported`
        });
      }

      const submissions = testcases.map(({input, output}) => ({
        source_code: Buffer.from(solutionCode).toString('base64'),
        language_id: languageId,
        stdin: Buffer.from(input).toString('base64'),
        expected_output: Buffer.from(output).toString('base64'),
      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map(({token}) => token);

      const results = await pollBatchResults(tokens);

      results.array.forEach((result, index) => {
        console.log("Result------", result);
        if(result.status.id !== 3) {
          return res.status(400).json({
            error: `Testcase ${index + 1} failed for language ${language}`,
          });
        }
      });
    }

    const updatedProblem = await db.problem.update({
      where: {id},
      data: updationData
    });

    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      updatedProblem
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({error: error.message || "Failed to update problem"});
  }
};

export const deleteProblem = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "You are not allowed to delete a problem" });
  }

  try {
    const problem = await db.problem.findUnique({ where: { id } });

    if (req.user.id !== problem.userId) {
      return res.status(403).json({ error: "Forbidden - This problem does not belongs to you" });
    }
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    await db.problem.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Problem deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Error while deleting problem" });
  }
};

export const getAllProblemsSolvedByUser = async (req, res) => {
  try {
    const problems = await db.problem.findMany({
      where: {
        solvedBy: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        solvedBy: {
          where: {
            userId: req.user.id
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Problems fetched successfully",
      problems
    });
  } catch (error) {
    console.error("Error fetching solved problems for current user: ", error);
    return res.status(500).json({error: error.message || "Error while fetching solved problems for currently logged in user"});
  }
};
