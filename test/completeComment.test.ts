import * as ASTTester from "@textlint/ast-tester";
import "jest";
import {
  ASTNodeTypes,
  TxtNodeLineLocation,
  TextNodeRange
} from "@textlint/ast-node-types";
import { latexParser } from "latex-utensils";
import {
  convertCommentToTxtNode,
  isAppearedBeforeNode,
  isIncludedByNode,
  isParentNode,
  insertComment,
  completeComments
} from "../src/completeComment";

const makeLocation = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): TxtNodeLineLocation => {
  return {
    start: {
      line: startLine,
      column: startColumn
    },
    end: {
      line: endLine,
      column: endColumn
    }
  };
};

const makeRange = (start: number, end: number): TextNodeRange => {
  return [start, end];
};

describe("Conversion of latexParser.Comment", () => {
  test("convert valid", async () => {
    const rawText = "\\begin{document}\n% comment\n\\end{document}";
    const comments = [
      {
        kind: "comment",
        content: " comment",
        location: {
          start: {
            offset: 17,
            line: 2,
            column: 1
          },
          end: {
            offset: 27,
            line: 3,
            column: 1
          }
        }
      }
    ];
    const expected = [
      {
        type: ASTNodeTypes.Comment,
        loc: makeLocation(2, 0, 3, 0),
        range: makeRange(17, 27),
        raw: "% comment\n",
        value: " comment"
      }
    ];
    const actual = convertCommentToTxtNode(
      rawText,
      comments as latexParser.Comment[]
    );
    expect(actual).toMatchObject(expected);
    ASTTester.test(actual[0]);
  });
  test("undefined", async () => {
    const actual = convertCommentToTxtNode("", undefined);
    expect(actual).toMatchObject([]);
  });
  test("null", async () => {
    const actual = convertCommentToTxtNode("", null);
    expect(actual).toMatchObject([]);
  });
});

describe("Whether the comment is appeared before the node", () => {
  test("the comment before the node", async () => {
    // % comment
    //
    // \begin{document}
    // \end{document}
    const commentRange = makeRange(0, 10);
    const nodeRange = makeRange(11, 42);
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeTruthy();
    expect(isIncludedByNode(nodeRange, commentRange)).toBeFalsy();
  });
  test("just before the node", async () => {	
    // % comment
    // \begin{ document }	
    // \end{document}	
    const commentRange = makeRange(0, 10);	
    const nodeRange = makeRange(10, 41);	
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeTruthy();	
    expect(isIncludedByNode(nodeRange, commentRange)).toBeFalsy();	
  });
  test("the comment after the node", async () => {
    // \begin{document}
    // \end{document}
    //
    // % comment
    const commentRange = makeRange(33, 43);
    const nodeRange = makeRange(0, 31);
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeFalsy();
    expect(isIncludedByNode(nodeRange, commentRange)).toBeFalsy();
  });
  test("just after the node", async () => {
    // \begin{document}	
    // \end{document}% comment	
    const commentRange = makeRange(31, 41);	
    const nodeRange = makeRange(0, 31);	
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeFalsy();	
    expect(isIncludedByNode(nodeRange, commentRange)).toBeFalsy();	
  });
  test("the comment included by the node", async () => {
    // \begin{document}
    //
    // % comment
    //
    // \end{document}
    const commentRange = makeRange(18, 28);
    const nodeRange = makeRange(0, 43);
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeFalsy();
    expect(isIncludedByNode(nodeRange, commentRange)).toBeTruthy();
  });
  test("the comment included by the node (on the same line)", async () => {	
    // \begin{document}% comment	
    // \end{document}	
    const commentRange = makeRange(16, 26);	
    const nodeRange = makeRange(0, 40);	
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeFalsy();	
    expect(isIncludedByNode(nodeRange, commentRange)).toBeTruthy();
  });
  test("the comment included by the node", async () => {
    // \begin{document}	
    // % comment	
    // \end{document}	
    const commentRange = makeRange(17, 27);
    const nodeRange = makeRange(0, 41);
    expect(isAppearedBeforeNode(nodeRange, commentRange)).toBeFalsy();
    expect(isIncludedByNode(nodeRange, commentRange)).toBeTruthy();
  });
});

describe("Test isParentNode", () => {
  test("valid", async () => {
    const node = {
      type: ASTNodeTypes.Document,
      raw: "",
      range: [0, 1] as TextNodeRange,
      loc: makeLocation(0, 0, 0, 0),
      children: []
    };
    expect(isParentNode(node)).toBeTruthy();
  });
  test("null", async () => {
    const node = {
      type: ASTNodeTypes.Document,
      raw: "",
      range: [0, 1] as TextNodeRange,
      loc: makeLocation(0, 0, 0, 0),
      children: null
    };
    expect(isParentNode(node)).toBeFalsy();
  });
  test("false", async () => {
    const node = {
      type: ASTNodeTypes.Comment,
      raw: "",
      range: [0, 1] as TextNodeRange,
      loc: makeLocation(0, 0, 0, 0),
      value: ""
    };
    expect(isParentNode(node)).toBeFalsy();
  });
});

describe("Test insertComment", () => {
  test("flat nodes", async () => {
    // \begin{document}
    // abcd
    // % comment
    // efgh
    // \end{document}
    const nodes = [
      {
        type: ASTNodeTypes.Document,
        range: makeRange(0, 52),
        loc: makeLocation(1, 0, 5, 14),
        raw: "",
        children: [
          {
            type: ASTNodeTypes.Str,
            range: makeRange(17, 21),
            loc: makeLocation(2, 0, 2, 4),
            raw: "abcd",
            value: "abcd"
          },
          {
            type: ASTNodeTypes.Str,
            range: makeRange(33, 37),
            loc: makeLocation(4, 0, 4, 4),
            raw: "efgh",
            value: "efgh"
          }
        ]
      }
    ];
    const comment = {
      type: ASTNodeTypes.Comment,
      range: makeRange(22, 23),
      loc: makeLocation(3, 0, 4, 0),
      raw: "% comment\n",
      value: " comment"
    };
    const expected = JSON.parse(JSON.stringify(nodes));
    expected[0].children.splice(1, 0, comment);

    const actual = insertComment(comment, nodes);
    expect(actual).toMatchObject(expected);
    for (const node of actual) {
      ASTTester.test(node);
    }
  });
  test("nested nodes", async () => {
    // \begin{document}
    // \begin{itemize}
    //     \item \textit{item1} % comment
    //     \item item2
    // \end{itemize}
    // \end{document}
    const nodes = [
      {
        type: ASTNodeTypes.Document,
        range: [0, 112] as TextNodeRange,
        loc: makeLocation(1, 0, 6, 14),
        raw: "",
        children: [
          {
            type: ASTNodeTypes.Paragraph,
            range: makeRange(17, 97),
            loc: makeLocation(2, 0, 5, 13),
            raw: "",
            children: [
              {
                type: ASTNodeTypes.Emphasis,
                range: makeRange(43, 57),
                loc: makeLocation(3, 10, 3, 24),
                raw: "",
                children: [
                  {
                    type: ASTNodeTypes.Str,
                    range: makeRange(51, 56),
                    loc: makeLocation(3, 18, 3, 23),
                    raw: "",
                    value: "item1"
                  }
                ]
              }
            ]
          },
          {
            type: ASTNodeTypes.Str,
            range: makeRange(78, 83),
            loc: makeLocation(4, 10, 4, 15),
            raw: "",
            value: "items"
          }
        ]
      }
    ];
    const comment = {
      type: ASTNodeTypes.Comment,
      range: makeRange(58, 68),
      loc: makeLocation(3, 25, 4, 0),
      raw: "% comment\n",
      value: " comment"
    };
    const expected = JSON.parse(JSON.stringify(nodes));
    expected[0].children[0].children.push(comment);

    const actual = insertComment(comment, nodes);
    expect(actual).toMatchObject(expected);
    for (const node of actual) {
      ASTTester.test(node);
    }
  });
  test("comment before document nodes", async () => {
    // % comment
    // \begin{document}
    // \end{document}
    const nodes = [
      {
        type: ASTNodeTypes.Document,
        range: makeRange(10, 41),
        loc: makeLocation(2, 0, 3, 14),
        raw: "",
        children: []
      }
    ];
    const comment = {
      type: ASTNodeTypes.Comment,
      range: makeRange(0, 10),
      loc: makeLocation(1, 0, 2, 0),
      raw: "% comment\n",
      value: " comment"
    };
    const expected = JSON.parse(JSON.stringify(nodes));
    expected.splice(0, 0, comment);

    const actual = insertComment(comment, nodes);
    expect(actual).toMatchObject(expected);
    for (const node of actual) {
      ASTTester.test(node);
    }
  });
  test("comment after document nodes", async () => {
    // \begin{document}
    // \end{document}
    // % comment
    const nodes = [
      {
        type: ASTNodeTypes.Document,
        range: makeRange(0, 31),
        loc: makeLocation(1, 0, 2, 14),
        raw: "",
        children: []
      }
    ];
    const comment = {
      type: ASTNodeTypes.Comment,
      range: makeRange(32, 42),
      loc: makeLocation(3, 0, 4, 0),
      raw: "% comment\n",
      value: " comment"
    };
    const expected = JSON.parse(JSON.stringify(nodes));
    expected.push(comment);

    const actual = insertComment(comment, nodes);
    expect(actual).toMatchObject(expected);
    for (const node of actual) {
      ASTTester.test(node);
    }
  });
  test("comment after text without any white space", async () => {
    // https://github.com/textlint/textlint-plugin-latex2e/issues/52
    // A%B
    // C
    const comment = {
      type: ASTNodeTypes.Comment,
      range: makeRange(1, 4),
      loc: makeLocation(1, 2, 2, 1),
      raw: "%B\n",
      value: "B"
    };
    const nodes = [
      {
        type: ASTNodeTypes.Str,
        range: makeRange(0, 1),
        loc: makeLocation(1, 1, 2, 2),
        raw: "A",
        value: "A",
      },
      {
        type: ASTNodeTypes.Str,
        range: makeRange(4, 5),
        loc: makeLocation(2, 1, 2, 2),
        raw: "C",
        value: "C",
      },
    ];
    const expected = JSON.parse(JSON.stringify(nodes));
    expected.splice(1, 0, comment);

    const actual = insertComment(comment, nodes);
    expect(actual).toMatchObject(expected);
    for (const node of actual) {
      ASTTester.test(node);
    }
  });
});

describe("Test completeComment", () => {
  test("One comment", async () => {
    const rawText = "\\begin{document}\n% comment\n\\end{document}";
    const nodes = {
      type: ASTNodeTypes.Document,
      range: makeRange(0, 52),
      loc: makeLocation(1, 0, 3, 14),
      raw: rawText,
      children: []
    };
    const comments = [
      {
        kind: "comment" as const,
        content: " comment",
        location: {
          start: {
            offset: 17,
            line: 2,
            column: 1
          },
          end: {
            offset: 27,
            line: 3,
            column: 1
          }
        }
      }
    ];
    const expectedComments = [
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(17, 27),
        loc: makeLocation(2, 0, 3, 0),
        raw: "% comment\n",
        value: " comment"
      }
    ];
    const expected = JSON.parse(JSON.stringify(nodes));
    expected.children = [expectedComments[0]];
    const actual = completeComments(comments)(rawText)(nodes);
    expect(actual).toMatchObject(expected);
    ASTTester.test(actual);
  });
  test("Multi comments", async () => {
    const rawText =
      "% a\n% b\n\\begin{document}\n% c\n% d\n\\end{document}\n% e\n% f";
    const nodes = {
      type: ASTNodeTypes.Document,
      range: makeRange(0, 56),
      loc: makeLocation(3, 0, 7, 0),
      raw: rawText,
      children: []
    };
    const comments = [
      {
        kind: "comment" as const,
        content: " a",
        location: {
          start: {
            offset: 0,
            line: 1,
            column: 1
          },
          end: {
            offset: 4,
            line: 2,
            column: 1
          }
        }
      },
      {
        kind: "comment" as const,
        content: " b",
        location: {
          start: {
            offset: 4,
            line: 2,
            column: 1
          },
          end: {
            offset: 8,
            line: 3,
            column: 1
          }
        }
      },
      {
        kind: "comment" as const,
        content: " c",
        location: {
          start: {
            offset: 25,
            line: 4,
            column: 1
          },
          end: {
            offset: 29,
            line: 5,
            column: 1
          }
        }
      },
      {
        kind: "comment" as const,
        content: " d",
        location: {
          start: {
            offset: 29,
            line: 5,
            column: 1
          },
          end: {
            offset: 33,
            line: 6,
            column: 1
          }
        }
      },
      {
        kind: "comment" as const,
        content: " e",
        location: {
          start: {
            offset: 48,
            line: 7,
            column: 1
          },
          end: {
            offset: 52,
            line: 8,
            column: 1
          }
        }
      },
      {
        kind: "comment" as const,
        content: " f",
        location: {
          start: {
            offset: 52,
            line: 8,
            column: 1
          },
          end: {
            offset: 56,
            line: 9,
            column: 1
          }
        }
      }
    ];
    const expected = JSON.parse(JSON.stringify(nodes));
    expected.children = [
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(0, 4),
        loc: makeLocation(1, 0, 2, 0),
        raw: "% a\n",
        value: " a"
      },
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(4, 8),
        loc: makeLocation(2, 0, 3, 0),
        raw: "% b\n",
        value: " b"
      },
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(25, 29),
        loc: makeLocation(4, 0, 5, 0),
        raw: "% c\n",
        value: " c"
      },
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(29, 33),
        loc: makeLocation(5, 0, 6, 0),
        raw: "% d\n",
        value: " d"
      },
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(48, 52),
        loc: makeLocation(7, 0, 8, 0),
        raw: "% e\n",
        value: " e"
      },
      {
        type: ASTNodeTypes.Comment,
        range: makeRange(52, 56),
        loc: makeLocation(8, 0, 9, 0),
        raw: "% f",
        value: " f"
      }
    ];

    const actual = completeComments(comments)(rawText)(nodes);
    expect(actual).toMatchObject(expected);
    ASTTester.test(actual);
  });
  test("Not destructive while occuring an error", async () => {
    const rawText = "% a\n\\begin{document}\n% b\n\\end{document}";
    const children = [
      {
        type: ASTNodeTypes.Str,
        range: makeRange(21, 25),
        loc: makeLocation(3, 0, 5, 0),
        raw: "% b\n",
        value: "% b"
      }
    ];
    const nodes = {
      type: ASTNodeTypes.Document,
      range: makeRange(0, 39),
      loc: makeLocation(1, 0, 4, 14),
      raw: rawText,
      children: [
        // Dummy object. It causes error.
        {
          type: ASTNodeTypes.Str,
          range: makeRange(21, 25),
          loc: makeLocation(3, 0, 5, 0),
          raw: "% b\n",
          value: "% b"
        }
      ]
    };
    const comments = [
      {
        kind: "comment" as const,
        content: " a",
        location: {
          start: {
            offset: 0,
            line: 1,
            column: 1
          },
          end: {
            offset: 4,
            line: 2,
            column: 1
          }
        }
      },
      {
        kind: "comment" as const,
        content: " b",
        location: {
          start: {
            offset: 21,
            line: 3,
            column: 1
          },
          end: {
            offset: 25,
            line: 4,
            column: 1
          }
        }
      }
    ];
    expect(() => {
      completeComments(comments)(rawText)(nodes);
    }).toThrow();
    expect(nodes.children.length).toBe(1);
    expect(nodes.children).toMatchObject(children);
  });
});
