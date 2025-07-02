import { configureStore } from "@reduxjs/toolkit";
import formReducer from "../hooks/claimFormSlice";

export const store = configureStore({
  reducer: {
    claimForm: formReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
