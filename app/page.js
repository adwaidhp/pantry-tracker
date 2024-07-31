"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDoc,
  querySnapshot,
  query,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
export default function Home() {
  const [items, setItems] = useState([
  ]);
  const [newItem, setNewItem] = useState({ name: "", count: "" });
  const [total, setTotal] = useState(0);
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
  //Read Items from database
  useEffect(() => {
    const q = query(collection(db, "items"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);

      //Read total from itemsArr
      const calculateTotal = () => {
        const totalCount = itemsArr.reduce(
          (sum, item) => sum + parseFloat(item.count),
          0
        );
        setTotal(totalCount)
      };
      calculateTotal();
      return ()=> unsubscribe();
    });
  }, []);

  //Delete items
  const deleteItem =  async(id)=>{
    await deleteDoc(doc(db,'items',id));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between sm:p-24 p-4">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="text-4xl p-4 text-center">Pantry Tracker</h1>
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
              className="rounded-lg text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl"
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
                < button onClick={() => deleteItem(item.id)} className="ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900 rounded-lg w-16">
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
        </div>
      </div>
    </main>
  );
}
