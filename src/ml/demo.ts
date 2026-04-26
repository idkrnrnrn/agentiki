import {
  demoCandidateSignals,
  demoVacancy,
  rankCandidate
} from "./index.ts";

const result = rankCandidate(demoVacancy, demoCandidateSignals);

console.log(JSON.stringify(result, null, 2));
