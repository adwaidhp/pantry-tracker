"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import OpenAI from "openai";

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", count: "" });
  const [total, setTotal] = useState(0);
  const [recipe, setRecipeSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to add an item to the database
  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== "" && newItem.count !== "") {
      await addDoc(collection(db, "items"), {
        name: newItem.name.trim(),
        count: newItem.count,
      });
      setNewItem({ name: "", count: "" });
    }
  };

  // Function to clear the entire database
  const clearDatabase = async () => {
    if (window.confirm("Are you sure you want to clear the database?")) {
      const q = query(collection(db, "items"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach(async (docSnapshot) => {
          await deleteDoc(doc(db, "items", docSnapshot.id));
        });
      });
      unsubscribe();
    }
  };

  // Read items from the database
  useEffect(() => {
    const q = query(collection(db, "items"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);

      // Calculate total count of items
      const calculateTotal = () => {
        const totalCount = itemsArr.reduce(
          (sum, item) => sum + parseFloat(item.count),
          0
        );
        setTotal(totalCount);
      };
      calculateTotal();
    });
    return () => unsubscribe();
  }, []);

  // Function to delete an individual item
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "items", id));
  };

  // OpenAI configuration for generating recipes
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // Function to generate a recipe using AI
  const generateRecipe = async () => {
    setLoading(true);
    const itemNames = items.map((item) => item.name).join(",");
    const chatCompletion = await getapires(itemNames);
    console.log(`${itemNames}`);
    console.log(chatCompletion.choices[0]?.message?.content);
    setRecipeSuggestions(chatCompletion.choices[0]?.message?.content || "");
    setLoading(false);
  };

  // Function to get API response from OpenAI
  async function getapires(itemNames) {
    return openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free ",
      messages: [
        {
          role: "user",
          content: `Clear all messages from before. This is a fresh chat, clear everything else. You are an expert chef with a deep understanding of various cuisines and cooking techniques. Based only on the ingredients provided, create a delicious and unique recipe. Include a brief description of the dish, a list of ingredients, and step-by-step instructions. 

Ingredients: ${itemNames}

There should be no asterisks in the output, dont use markdown format
Please ensure the recipe is suitable for someone with moderate cooking skills and provides an estimated cooking time.

Format:
 Dish Name:
 Description: (A short paragraph describing the dish, its flavors, and any notable characteristics.)
 Ingredients: (List all required ingredients, including no more than 3 additional ones necessary to complement the provided items.)
 Instructions: (Step-by-step cooking instructions, with estimated times for each step.)

Remember to make the recipe creative and appealing! Do not add asterisks or any unnecessary styling. Don't use markdown for styling
`,
        },
      ],
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between sm:p-24 p-4">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="text-4xl p-4 text-center font-bold">
          Pantry Tracker and Recipe Maker
        </h1>
        <div className="bg-slate-800 p-4 rounded-lg">
          <form className="grid grid-cols-6 items-center text-black">
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="col-span-3 p-3 border rounded"
              type="text"
              placeholder="Enter item"
            />
            <input
              value={newItem.count}
              onChange={(e) =>
                setNewItem({ ...newItem, count: e.target.value })
              }
              className="col-span-2 p-3 border mx-3 rounded"
              type="text"
              placeholder="Enter count"
            />
            <button
              onClick={addItem}
              className="rounded-lg text-white bg-slate-950 hover:bg-green-900 p-3 text-xl"
              type="submit"
            >
              +
            </button>
          </form>
          <ul>
            {items.map((item, id) => (
              <li
                key={id}
                className="rounded-lg my-4 w-full flex justify-between bg-slate-950"
              >
                <div className="p-4 w-full flex justify-between">
                  <span className="capitalize">{item.name}</span>
                  <span>{item.count}</span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="ml-8 p-4 border-l-2 border-slate-900 hover:bg-red-900 rounded-lg w-16"
                >
                  X
                </button>
              </li>
            ))}
          </ul>
          {items.length < 1 ? (
            ""
          ) : (
            <div className="flex justify-between p-3">
              <span>Total number of items</span>
              <span>{total}</span>
            </div>
          )}
          <div className="w-full text-center">
            <button
              onClick={generateRecipe}
              className="mt-4 p-3 bg-slate-950 hover:bg-slate-900 text-white rounded-lg  transition duration-300"
            >
              Generate Recipe using AI
            </button>
            {items.length > 1 && (
              <button
                onClick={clearDatabase}
                className="mt-4 p-3 bg-slate-950 hover:bg-red-700 text-white rounded-lg transition duration-300 mx-4"
              >
                Clear All
              </button>
            )}
            {loading && <p>Loading...</p>}
            {recipe && (
              <div className="mt-6 p-4 bg-slate-950 rounded-lg shadow-lg text-white">
                <h2 className="text-2xl font-semibold mb-2">
                  Generated Recipe
                </h2>
                <div className="space-y-2">
                  {recipe.split("\n").map((line, index) => (
                    <p
                      key={index}
                      className="text-lg leading-relaxed text-left"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
