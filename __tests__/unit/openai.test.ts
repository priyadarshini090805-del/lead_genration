jest.mock("openai", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: '{"sentiment":"POSITIVE","score":0.9,"explanation":"Positive tone"}' } }],
          }),
        },
      },
    })),
  };
});

import { analyzeSentiment, generateSmartReplies } from "@/lib/openai";

describe("openai — analyzeSentiment", () => {
  it("returns parsed sentiment object", async () => {
    const result = await analyzeSentiment("I am very interested!");
    expect(result).toHaveProperty("sentiment");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("explanation");
  });
});
