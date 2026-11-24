const brands = ["Toyota", "Volkswagen", "Fiat", "Chevrolet", "Honda", "Hyundai", "Renault", "Jeep", "Ford", "Nissan", "BYD", "Peugeot", "BMW", "Mercedes-Benz"];
document.querySelector("#brands-list").innerHTML = [...brands, ...brands].map((brand) => `<span>${brand}</span>`).join("");
document.querySelector("#year").textContent = new Date().getFullYear();
