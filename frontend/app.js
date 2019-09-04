const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const exjwt = require("express-jwt");
const morgan = require("morgan");
const path = require("path");

const app = express();

app.use(morgan("dev"));

// Setting up bodyParser to use json and set it to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// инициализация middleware от express-jwt
const jwtMW = exjwt({
  secret: "topsecretkey"
});

// замоканная база данных
// !!! при кажом перезапуске api база массив users будет устанавливаться в это состояние!!
let users = [
  {
    id: 1,
    username: "test",
    password: "123",
    avatar: `https://picsum.photos/1/200/200`,
    about:
      "Я тестовый пользователь номер один. Я никогда не пропадаю между запусками api!"
  },
  {
    id: 2,
    username: "test2",
    avatar: `https://picsum.photos/2/200/200`,
    password:
      "Я тестовый пользователь номер два. Я тоже никогда не пропадаю между запусками api!"
  }
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    user => user.username == username && user.password == password
  );

  if (user) {
    // если пользователь найден в массиве users
    const token = jwt.sign(
      { id: user.id, username: user.username },
      "topsecretkey",
      { expiresIn: 129600 }
    );

    res.json({
      success: true,
      err: null,
      token
    });
  } else {
    res.status(401).json({
      success: false,
      token: null,
      err: "Введите правильные имя пользователя/пароль"
    });
  }
});

app.get("/about", jwtMW, (req, res) => {
  const { id } = req.user;
  const user = users.find(user => user.id == id);
  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({
      success: false,
      err: "Не удалось получить информацию о пользователе"
    });
  }
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const isRegistered = users.some(user => user.username == username);
  if (isRegistered) {
    res.status(404).json({
      success: false,
      err: "Пользователь с таким именем уже зарегестрирован"
    });
    return;
  }
  const id = users.length + 1;
  users.push({
    id,
    username,
    password,
    avatar: `https://picsum.photos/id/${id}/200/200`,
    about: null
  });
  res.json({
    success: true,
    message: "Пользователь успешно зарегестрирован"
  });
});

// error handling
app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    // если пользователь не авторизован - отправляем ошибку о том что он не авторизован
    res.status(401).send(err);
  } else {
    next(err);
  }
});

//дефолтный порт приложения
const PORT = 8080;
app.listen(PORT, () => {
  // eslint-disable-next-line
  console.log(`Сервер с API стартовал по адресу http://localhost:${PORT}`);
});
