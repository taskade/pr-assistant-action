"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = __importStar(require("@actions/core"));
var github_1 = __importDefault(require("@actions/github"));
var conventional_commits_parser_1 = __importDefault(require("conventional-commits-parser"));
function verifyApprovals() {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var minApprovalCountStr, minApprovalCount, token, octokit, prNumber, prAuthor, _e, owner, repo, reviewsResponse, reviews, approvalCount, body;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    minApprovalCountStr = core.getInput('min-approval-count');
                    minApprovalCount = parseInt(minApprovalCountStr, 10);
                    token = core.getInput('github_token');
                    octokit = github_1.default.getOctokit(token);
                    prNumber = (_a = github_1.default.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number;
                    if (prNumber == null) {
                        throw new Error('This action can only be triggered from events with pull_request in the payload');
                    }
                    prAuthor = (_d = (_c = (_b = github_1.default.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.login) !== null && _d !== void 0 ? _d : '';
                    _e = github_1.default.context.repo, owner = _e.owner, repo = _e.repo;
                    return [4 /*yield*/, octokit.rest.pulls.listReviews({
                            owner: owner,
                            repo: repo,
                            pull_number: prNumber,
                        })];
                case 1:
                    reviewsResponse = _f.sent();
                    reviews = reviewsResponse.data;
                    approvalCount = reviews.filter(function (review) { return review.state === 'approved'; }).length;
                    body = "@" + prAuthor + " " + minApprovalCount + " approvals reached! \uD83D\uDE80\uD83D\uDE80\uD83D\uDE80\uD83D\uDE80\uD83D\uDE80";
                    if (approvalCount < minApprovalCount) {
                        body = approvalCount + "/" + minApprovalCount + " approvals to merge";
                    }
                    return [4 /*yield*/, octokit.rest.issues.createComment({
                            owner: owner,
                            repo: repo,
                            issue_number: prNumber,
                            body: body,
                        })];
                case 2:
                    _f.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function verifyPRTitle() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var prTitle, prNumber, parser, parsedTitle, hasType, hasReferences, _c, owner, repo, token, octokit, body;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    prTitle = (_a = github_1.default.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.title;
                    prNumber = (_b = github_1.default.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.number;
                    if (prNumber == null) {
                        throw new Error('This action can only be triggered from events with pull_request in the payload');
                    }
                    parser = conventional_commits_parser_1.default();
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            parser.on('data', resolve);
                            parser.on('error', reject);
                            parser.pipe(prTitle);
                        })];
                case 1:
                    parsedTitle = _d.sent();
                    hasType = parsedTitle.type != null;
                    hasReferences = parsedTitle.references.length > 0;
                    _c = github_1.default.context.repo, owner = _c.owner, repo = _c.repo;
                    token = core.getInput('github_token');
                    octokit = github_1.default.getOctokit(token);
                    body = '';
                    if (hasType && hasReferences) {
                        body = 'Excellent PR title! 👍';
                    }
                    else {
                        body = 'The title of this PR can be improved:\n\n';
                        if (!hasType) {
                            body += '- Type required (feat, fix, chore, etc.)\n';
                        }
                        if (!hasReferences) {
                            body += '- Reference to issue required (e.g. #99)\n';
                        }
                        body +=
                            '\n\n[Conventional Commits 1.0.0 Specification](https://www.conventionalcommits.org/en/v1.0.0/#summary)';
                    }
                    return [4 /*yield*/, octokit.rest.issues.createComment({
                            owner: owner,
                            repo: repo,
                            issue_number: prNumber,
                            body: body,
                        })];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = github_1.default.context.eventName;
                    switch (_a) {
                        case 'pull_request': return [3 /*break*/, 1];
                        case 'pull_request_review': return [3 /*break*/, 3];
                    }
                    return [3 /*break*/, 5];
                case 1: return [4 /*yield*/, verifyPRTitle()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, verifyApprovals()];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
run().catch(function (error) {
    core.error(error.message);
});
