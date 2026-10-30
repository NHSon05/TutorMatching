"use client";
import { useReducer } from "react";
import { useHireRequests } from "@/hooks/use-hire-requests";

type Pages = { status: string; cursors: (string | undefined)[] };
type Action =
  | { type: "filter"; status: string }
  | { type: "next"; cursor: string }
  | { type: "previous" }
  | { type: "first" };
function reducer(state: Pages, action: Action): Pages {
  switch (action.type) {
    case "filter":
      return { status: action.status, cursors: [undefined] };
    case "first":
      return { ...state, cursors: [undefined] };
    case "previous":
      return {
        ...state,
        cursors:
          state.cursors.length > 1 ? state.cursors.slice(0, -1) : state.cursors,
      };
    case "next":
      return state.cursors.at(-1) === action.cursor
        ? state
        : { ...state, cursors: [...state.cursors, action.cursor] };
  }
}
export function useHireRequestList() {
  const [pages, dispatch] = useReducer(reducer, {
    status: "",
    cursors: [undefined],
  });
  const query = useHireRequests({
    status: pages.status || undefined,
    cursor: pages.cursors.at(-1),
  });
  return {
    ...query,
    status: pages.status,
    page: pages.cursors.length,
    changeStatus: (status: string) => dispatch({ type: "filter", status }),
    next: () => {
      if (!query.isFetching && query.data?.nextCursor)
        dispatch({ type: "next", cursor: query.data.nextCursor });
    },
    previous: () => dispatch({ type: "previous" }),
    first: () => dispatch({ type: "first" }),
    refresh: () => {
      if (pages.cursors.length === 1) void query.refetch();
      else dispatch({ type: "first" });
    },
  };
}
