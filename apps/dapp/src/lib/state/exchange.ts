import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface ExchangeState {
  isExpertMode: boolean
}

const initialState: ExchangeState = {
  isExpertMode: false,
}

export const counterSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {
    incrementByAmount: (state, action: PayloadAction<boolean>) => {
      state.isExpertMode = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const actions = counterSlice.actions

export default counterSlice.reducer