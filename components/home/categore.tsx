/*components:categre.tsx */
import React from "react";

const categories = [
  { name: "Grocery", img: "/path/to/grocery.png" },
  { name: "Home", img: "/path/to/home.png" },
  { name: "Patio & Garden", img: "/path/to/patio.png" },
  { name: "Fashion", img: "/path/to/fashion.png" },
  { name: "Electronics", img: "/path/to/electronics.png" },
  { name: "Baby", img: "/path/to/baby.png" },
  { name: "Toys", img: "/path/to/toys.png" },
  { name: "Health & Wellness", img: "/path/to/health.png" },
  { name: "Personal Care", img: "/path/to/care.png" },
  { name: "Beauty", img: "/path/to/beauty.png" },
];

const Categories = () => {
  return (
    <div className="flex flex-wrap justify-center py-8 ">
      {categories.map((category, index) => (
        <div key={index} className="flex flex-col items-center m-6">
          <img
            src={category.img}
            alt={category.name}
            className="w-20 h-20 rounded-full bg-blue-100 p-4"
          />
          <p className="text-center mt-2 text-sm font-medium">{category.name}</p>
        </div>
      ))}
      <a
        href="#"
        className="ml-4 text-blue-600 font-medium hover:underline -mt-4 "
      >
        View all
      </a>
    </div>
  );
};

export default Categories;
