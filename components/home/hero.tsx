"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const cards = [
    {
      img: "../../smartphone.png",
      title: "Smartphones",
      category: "smartphones",
    },
    {
      img: "../../tablet.png",
      title: "Tablets",
      category: "tablets",
    },
    {
      img: "../../laptop.png",
      title: "laptop",
      category: "laptop",
    },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
          }`}
        >
          {cards.map((card, index) => (
            <div key={index} className="group relative w-full max-w-sm">
              <div className="relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3 border border-gray-100 overflow-hidden">
                <div className="relative h-80 bg-gray-50 overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="h-full w-full object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {card.title}
                  </h2>

                  <Link
                    href={`/products?category=${card.category}`}
                    className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-8 py-4 rounded-2xl font-semibold text-sm transition-all duration-500 shadow-md hover:shadow-lg transform hover:-translate-y-1 inline-block w-full"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
