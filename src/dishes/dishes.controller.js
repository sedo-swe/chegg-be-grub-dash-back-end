const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        if (propertyName == "description" && data["description"] == "") {
            next({ status: 400, message: `Dish mush include a ${propertyName}` });
        }
        if (propertyName == "price" && (data["price"] <= 0 || typeof data["price"] !== "number")) {
            next({ status: 400, message: `Dish mush include a ${propertyName} that is an integer greater than 0` });
        }
        return next();
      }
      next({ status: 400, message: `Dish mush include a ${propertyName}` });
    };
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
      id: nextId(),
      name: name,
      description: description,
      price: price,
      image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function list(req, res) {
    res.json({ data: dishes });
}

function idInBodyMatchDishId(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id) {
        if (id !== dishId) {
            next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
            });
        }
    }
    next();
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
}

function read(req, res) {
    const foundDish = res.locals.dish;
    res.json({ data: foundDish });
}

function update(req, res) {
    const foundDish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    // Update the paste
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
  
    res.json({ data: foundDish });
}


module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        idInBodyMatchDishId,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        update
    ],
};