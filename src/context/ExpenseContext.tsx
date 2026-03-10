"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Regime = "ordinario" | "forfettario";

export interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
}

interface ExpenseContextType {
    regime: Regime;
    setRegime: (r: Regime) => void;
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, "id" | "date">) => void;
    removeExpense: (id: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
    const [regime, setRegime] = useState<Regime>("ordinario");
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const addExpense = (expense: Omit<Expense, "id" | "date">) => {
        const newExpense: Expense = {
            ...expense,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
        };
        setExpenses((prev) => [...prev, newExpense]);
    };

    const removeExpense = (id: string) => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
    };

    return (
        <ExpenseContext.Provider value={{ regime, setRegime, expenses, addExpense, removeExpense }}>
            {children}
        </ExpenseContext.Provider>
    );
};

export const useExpenseContext = () => {
    const context = useContext(ExpenseContext);
    if (context === undefined) {
        throw new Error("useExpenseContext must be used within an ExpenseProvider");
    }
    return context;
};
