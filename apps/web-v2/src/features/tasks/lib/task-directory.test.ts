import { describe, expect, it } from "vitest";
import { TaskStatus } from "@hassad/shared";
import { getAllowedTeamTaskStatuses } from "./task-directory";

describe("getAllowedTeamTaskStatuses", () => {
  it("requires Team users to start before submitting", () => {
    expect(getAllowedTeamTaskStatuses(TaskStatus.TODO)).toEqual([TaskStatus.IN_PROGRESS]);
    expect(getAllowedTeamTaskStatuses(TaskStatus.IN_PROGRESS)).toEqual([TaskStatus.IN_REVIEW]);
  });

  it("allows revision work to return to execution", () => {
    expect(getAllowedTeamTaskStatuses(TaskStatus.REVISION)).toEqual([TaskStatus.IN_PROGRESS]);
  });

  it("allows PM review decisions to return to revision", () => {
    expect(getAllowedTeamTaskStatuses(TaskStatus.IN_REVIEW)).toEqual([TaskStatus.REVISION]);
  });

  it("does not expose a Team transition after approval", () => {
    expect(getAllowedTeamTaskStatuses(TaskStatus.DONE)).toEqual([]);
  });
});
