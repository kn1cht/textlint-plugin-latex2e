/*
 * This file is part of textlint-plugin-latex2e
 *
 * textlint-plugin-latex2e is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * textlint-plugin-latex2e is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with textlint-plugin-latex2e.  If not, see <http://www.gnu.org/licenses/>.
 */
import {
  TextlintPluginProcessor,
  TextlintPluginOptions,
} from "@textlint/types";
import { parse } from "./latex-to-ast";

export class LaTeXProcessor implements TextlintPluginProcessor {
  private config: TextlintPluginOptions;

  public constructor(config = {}) {
    this.config = config;
  }

  public availableExtensions(): string[] {
    return [".tex", ".cls"].concat(this.config.extensions || []);
  }

  public processor(): ReturnType<TextlintPluginProcessor["processor"]> {
    return {
      preProcess(text: string) {
        return parse(text);
      },
      postProcess(messages: any[], filePath?: string) {
        return {
          messages,
          filePath: filePath ? filePath : "<latex>",
        };
      },
    };
  }
}
