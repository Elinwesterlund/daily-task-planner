import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_NAME, hydrateProfile, saveProfile, useProfile } from "@/lib/todo-store";

function readProfile(): { name: string; photo: string | null } {
  return useProfile[0];
}

describe("Profile name", () => {
  beforeEach(() => {
    localStorage.clear();
    hydrateProfile();
  });

  it("starts out as Åsa when nothing has been saved yet", () => {
    expect(readProfile().name).toBe("Åsa");
    expect(readProfile().photo).toBeNull();
  });

  it("keeps a name the user typed", () => {
    saveProfile({ name: "Elin" });
    expect(readProfile().name).toBe("Elin");
    expect(JSON.parse(localStorage.getItem("todo.profile") ?? "{}")).toMatchObject({ name: "Elin" });
  });

  it("falls back to Åsa when the name box is emptied", () => {
    saveProfile({ name: "Elin" });
    saveProfile({ name: "   " });
    expect(readProfile().name).toBe(DEFAULT_NAME);
  });

  it("keeps the picture when only the name is changed", () => {
    saveProfile({ photo: "data:image/jpeg;base64,abc" });
    saveProfile({ name: "Elin" });
    expect(readProfile()).toEqual({ name: "Elin", photo: "data:image/jpeg;base64,abc" });
  });

  it("drops the picture on request but keeps the name", () => {
    saveProfile({ name: "Elin", photo: "data:image/jpeg;base64,abc" });
    saveProfile({ photo: null });
    expect(readProfile()).toEqual({ name: "Elin", photo: null });
  });
});
