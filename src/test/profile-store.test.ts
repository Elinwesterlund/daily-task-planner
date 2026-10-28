import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_NAME, getProfile, hydrateProfile, saveProfile } from "@/lib/todo-store";

describe("Profile name", () => {
  beforeEach(() => {
    localStorage.clear();
    hydrateProfile();
  });

  it("starts out as Åsa when nothing has been saved yet", () => {
    expect(getProfile().name).toBe("Åsa");
    expect(getProfile().photo).toBeNull();
  });

  it("keeps a name the user typed", () => {
    saveProfile({ name: "Elin" });
    expect(getProfile().name).toBe("Elin");
    expect(JSON.parse(localStorage.getItem("todo.profile") ?? "{}")).toMatchObject({ name: "Elin" });
  });

  it("falls back to Åsa when the name box is emptied", () => {
    saveProfile({ name: "Elin" });
    saveProfile({ name: "   " });
    expect(getProfile().name).toBe(DEFAULT_NAME);
  });

  it("keeps the picture when only the name is changed", () => {
    saveProfile({ photo: "data:image/jpeg;base64,abc" });
    saveProfile({ name: "Elin" });
    expect(getProfile()).toEqual({ name: "Elin", photo: "data:image/jpeg;base64,abc" });
  });

  it("drops the picture on request but keeps the name", () => {
    saveProfile({ name: "Elin", photo: "data:image/jpeg;base64,abc" });
    saveProfile({ photo: null });
    expect(getProfile()).toEqual({ name: "Elin", photo: null });
  });
});
