import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/stores/use-auth-store";
import type { UserProfile } from "@/types/user";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("has correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.roles).toEqual([]);
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it("sets auth info with user and accessToken", () => {
    const mockUser: UserProfile = {
      id: "u-123",
      email: "test@example.com",
      fullName: "Nguyễn Văn A",
      role: "LEARNER",
      status: "ACTIVE",
      avatarUrl: "https://example.com/avatar.png",
      phoneNumber: "0901234567",
    };

    useAuthStore.getState().setAuth({
      user: mockUser,
      accessToken: "mock-jwt-token",
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.role).toBe("LEARNER");
    expect(state.roles).toEqual(["LEARNER"]);
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("mock-jwt-token");
  });

  it("updates user profile via setUser and clears via null", () => {
    const mockUser = {
      id: "u-456",
      email: "tutor@example.com",
      fullName: "Trần Thị B",
      role: "TUTOR" as const,
      status: "ACTIVE" as const,
    };

    useAuthStore.getState().setUser(mockUser);
    let state = useAuthStore.getState();
    expect(state.user?.fullName).toBe("Trần Thị B");
    expect(state.role).toBe("TUTOR");
    expect(state.roles).toEqual(["TUTOR"]);
    expect(state.isAuthenticated).toBe(true);

    useAuthStore.getState().setUser(null);
    state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.roles).toEqual([]);
    expect(state.isAuthenticated).toBe(false);
  });

  it("updates accessToken via setAccessToken", () => {
    useAuthStore.getState().setAccessToken("token-abc");
    let state = useAuthStore.getState();
    expect(state.accessToken).toBe("token-abc");
    expect(state.isAuthenticated).toBe(true);

    useAuthStore.getState().setAccessToken(null);
    state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("updates partial profile fields via updateProfile", () => {
    useAuthStore.getState().setAuth({
      user: {
        id: "u-789",
        email: "user@example.com",
        fullName: "Lê Văn C",
        role: "ADMIN",
        status: "ACTIVE",
      },
      accessToken: "token-admin",
    });

    useAuthStore.getState().updateProfile({
      fullName: "Lê Văn C (Updated)",
      phoneNumber: "0987654321",
    });

    const state = useAuthStore.getState();
    expect(state.user?.fullName).toBe("Lê Văn C (Updated)");
    expect(state.user?.phoneNumber).toBe("0987654321");
    expect(state.user?.email).toBe("user@example.com");
    expect(state.role).toBe("ADMIN");
  });

  it("resets all state on clearAuth", () => {
    useAuthStore.getState().setAuth({
      user: {
        id: "u-999",
        email: "clear@example.com",
        fullName: "Test",
        role: "LEARNER",
        status: "ACTIVE",
      },
      accessToken: "token",
    });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.roles).toEqual([]);
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });
});
