const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: orders });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function propertyIsNotEmpty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (propertyName === "dishes") {
            if (data[propertyName] != null && Array.isArray(data[propertyName]) && data[propertyName].length > 0) {
                return next();
            }
            next({ status: 400, message: `Order must include at least one dish` });
        } else {
            if (data[propertyName] != "") {
                return next();
            }
        }
        next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function dishQuantityIsValid(req, res, next) {
    const { data = { dishes } } = req.body;
    data["dishes"].forEach((dish, index) => {
        if (!dish.hasOwnProperty("quantity") || dish["quantity"] <= 0 || typeof dish["quantity"] !== "number") {
            return next({
                status: 400, 
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
        
    });
    next();
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: "pending",
        dishes: dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
}

function read(req, res) {
    const foundOrder = res.locals.order;
    res.json({ data: foundOrder });
}

function idInBodyMatchDishId(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id) {
        if (id !== orderId) {
            return next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
            });
        }
    }
    next();
}

function statusPropertyIsValid(req, res, next) {
    const validStatus =  ["pending", "preparing", "out-for-delivery", "delivered"];
    const { data: { status } = {} } = req.body;
    if (status && status != "" && validStatus.includes(status)) {
        return next();
    }
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
}

function orderStatusIsNotDelivered(req, res, next) {
    const foundOrder = res.locals.order;
    if ( foundOrder.status !== "delivered") {
        return next();
    }
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
}

function update(req, res) {
    const foundOrder = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
    // Update the order
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;
  
    res.json({ data: foundOrder });
}

function orderStatusIsPending(req, res, next) {
    const foundOrder = res.locals.order;
    if ( foundOrder.status === "pending") {
        return next();
    }
    next({
        status: 400,
        message: `An order cannot be deleted unless it is pending`,
    });
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        propertyIsNotEmpty("deliverTo"),
        propertyIsNotEmpty("mobileNumber"),
        propertyIsNotEmpty("dishes"),
        dishQuantityIsValid,
        create
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        orderStatusIsNotDelivered,
        idInBodyMatchDishId,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        statusPropertyIsValid,
        bodyDataHas("dishes"),
        propertyIsNotEmpty("deliverTo"),
        propertyIsNotEmpty("mobileNumber"),
        propertyIsNotEmpty("dishes"),
        dishQuantityIsValid,
        update
    ],
    delete: [
        orderExists,
        orderStatusIsPending,
        destroy
    ],
};


/*
POST /orders
{
  "data": {
    "deliverTo": "308 Negra Arroyo Lane, Albuquerque, NM",
    "mobileNumber": "(505) 143-3369",
    "status": "delivered",
    "dishes": [
      {
        "id": "d351db2b49b69679504652ea1cf38241",
        "name": "Dolcelatte and chickpea spaghetti",
        "description": "Spaghetti topped with a blend of dolcelatte and fresh chickpeas",
        "image_url": "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?h=530&w=350",
        "price": 19,
        "quantity": 2
      }
    ]
  }
}
 */