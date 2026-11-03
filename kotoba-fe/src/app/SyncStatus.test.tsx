import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { setSyncPhase } from "@/lib/store";
import { syncProgress } from "./(auth)/actions";
import { Sync, SyncStatus } from "./Sync";

// The server actions are not under test; a status line never reaches them without a mounted <Sync>.
vi.mock("./(auth)/actions", () => ({ logout: vi.fn(), syncProgress: vi.fn() }));

const ME = "me@example.com";
const seed = (srs: object, sync?: object) => {
  localStorage.setItem("kotoba.srs.v1", JSON.stringify(srs));
  if (sync) localStorage.setItem("kotoba.sync.v1", JSON.stringify(sync));
};

describe("SyncStatus", () => {
  it("says Đã lưu when nothing is waiting", () => {
    seed({ a: { box: 1, due: "2026-11-03", at: 5 } }, { owner: ME, lastSync: 10, forget: [] });
    render(<SyncStatus uid={ME} lang="vi" />);
    expect(screen.getByText("Đã lưu")).toBeInTheDocument();
  });
  it("counts the changes waiting for the next push", () => {
    seed({ a: { box: 1, due: "2026-11-03", at: 5 }, b: { box: 1, due: "2026-11-03", at: 15 }, c: { box: 0, due: "2026-11-03", at: 16 } }, { owner: ME, lastSync: 10, forget: [] });
    render(<SyncStatus uid={ME} lang="vi" />);
    expect(screen.getByText("Chờ lưu 2 thay đổi")).toBeInTheDocument();
  });
  it("uses the English wording", () => {
    seed({ b: { box: 1, due: "2026-11-03", at: 15 } }, { owner: ME, lastSync: 10, forget: [] });
    render(<SyncStatus uid={ME} lang="en" />);
    expect(screen.getByText("1 change waiting to save")).toBeInTheDocument();
  });
  it("reports a failed push with a retry that pushes again", async () => {
    seed({}, { owner: ME, lastSync: 10, forget: [] });
    render(<SyncStatus uid={ME} lang="vi" />);
    act(() => setSyncPhase("failed"));
    const status = screen.getByText(/Lỗi đồng bộ/);
    expect(status).toHaveAttribute("aria-live", "polite");
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    // No <Sync> is mounted, so the push has no account to send to and succeeds at once.
    expect(await screen.findByText("Đã lưu")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  });

  it("turns to Lỗi đồng bộ when a real push fails, and back to Đã lưu when the retry gets through", async () => {
    seed({ a: { box: 1, due: "2026-11-03", at: 5 } }, { owner: ME, lastSync: 10, forget: [] });
    vi.mocked(syncProgress).mockResolvedValueOnce({ failed: true });
    render(<><Sync uid={ME} /><SyncStatus uid={ME} lang="vi" /></>);
    expect(await screen.findByText(/Lỗi đồng bộ/)).toBeInTheDocument();
    vi.mocked(syncProgress).mockResolvedValueOnce({ failed: false, remote: null });
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Đã lưu")).toBeInTheDocument();
    expect(syncProgress).toHaveBeenCalledTimes(2);
  });

  it("says Đã lưu after a push whose reply is exactly the local cards", async () => {
    const cards = { a: { box: 1, due: "2026-11-03", at: 15, lapses: 0 } };
    seed(cards, { owner: ME, lastSync: 10, forget: [] });
    vi.mocked(syncProgress).mockResolvedValueOnce({ failed: false, remote: { cards, activity: { days: {} } } });
    render(<><Sync uid={ME} /><SyncStatus uid={ME} lang="vi" /></>);
    expect(screen.getByText("Chờ lưu 1 thay đổi")).toBeInTheDocument();
    expect(await screen.findByText("Đã lưu")).toBeInTheDocument();
  });

  it("shows Đang lưu… while a push with nothing pending is in flight", async () => {
    seed({}, { owner: ME, lastSync: 10, forget: [] });
    render(<SyncStatus uid={ME} lang="vi" />);
    act(() => setSyncPhase("syncing"));
    expect(screen.getByText("Đang lưu…")).toBeInTheDocument();
    act(() => setSyncPhase("idle"));
    expect(screen.getByText("Đã lưu")).toBeInTheDocument();
  });
});
