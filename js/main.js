// --- Data & Models ---
class Book {
  constructor(title, author, genre, status, year, id = Date.now()) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.genre = genre;
    this.status = status;
    this.year = year;
    this.reviews = [];
  }
}

class Review {
  constructor(user, text, rating, date = new Date().toLocaleDateString()) {
    this.user = user;
    this.text = text;
    this.rating = rating;
    this.date = date;
  }
}

const GENRES = ['Роман', 'Фантастика', 'Научная', 'Биография', 'Детектив', 'Другое'];

// --- State ---
let books = [];
let filters = { genre: 'all', status: 'all', author: 'all' };

// --- ASYNC JSON LOADING ---
function loadBooksFromJson(cb) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'data/books.json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        try {
          cb(JSON.parse(xhr.responseText));
        } catch {
          showNotif('Ошибка чтения JSON', true);
        }
      } else {
        showNotif('Ошибка загрузки данных', true);
      }
    }
  };
  xhr.send();
}

// --- INIT ---
function loadBooks() {
  let b = localStorage.getItem('books-mylibrary');
  if (b) return JSON.parse(b);
  
  loadBooksFromJson(function(data) {
    books = data;
    saveBooks();
    renderBooks();
  });
  
  return [];
}

function saveBooks() {
  localStorage.setItem('books-mylibrary', JSON.stringify(books));
}

// --- UI ---
function renderBooks() {
  const el = document.getElementById('books-list');
  let list = books;

  if (filters.genre !== 'all') list = list.filter(b => b.genre === filters.genre);
  if (filters.status !== 'all') list = list.filter(b => b.status === filters.status);
  if (filters.author !== 'all') list = list.filter(b => b.author === filters.author);
  
  el.innerHTML = '';
  
  if (!list.length) {
    el.innerHTML = '<div style="color:#aaa;text-align:center;width:100%">Нет книг</div>';
    return;
  }

  for (const book of list) {
    const reviewsCount = book.reviews ? book.reviews.length : 0;
    el.innerHTML += `
      <div class="book-card" id="book-${book.id}">
        <div class="book-title">${book.title}</div>
        <div class="book-author">Автор: ${book.author}</div>
        <div class="book-genre">Жанр: ${book.genre}</div>
        <div class="book-status">Статус: ${book.status}</div>
        <div class="book-year">Год: ${book.year}</div>
        <div class="card-actions">
          <button onclick="editBook(${book.id})">Редактировать</button>
          <button class="delete" onclick="deleteBook(${book.id})">Удалить</button>
          <button onclick="openReviewForm(${book.id})">Оставить отзыв</button>
          <button onclick="showReviews(${book.id})">Показать отзывы (${reviewsCount})</button>
        </div>
      </div>`;
  }
}

function showNotif(msg, error = false) {
  const notif = document.createElement('div');
  notif.className = 'notif';
  notif.style.background = error ? '#ff4253' : '#774cfa';
  notif.innerText = msg;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2900);
}

// --- Book form modal ---
function openBookForm(editId) {
  let book = books.find(b => b.id === editId) || {};
  let isEdit = !!editId;
  
  let modalHtml = `
    <h2>${isEdit ? 'Редактировать' : 'Добавить'} книгу</h2>
    <label>Название<input id="b-title" value="${book.title || ''}"></label>
    <label>Автор<input id="b-author" value="${book.author || ''}"></label>
    <label>Жанр
      <select id="b-genre">
        ${GENRES.map(g => `<option${book.genre === g ? ' selected' : ''}>${g}</option>`).join('')}
      </select>
    </label>
    <label>Год издания<input id="b-year" type="number" value="${book.year || ''}" min="1500" max="2100"></label>
    <label>Статус
      <div>
        <label><input type="radio" name="b-status" value="Прочитана" ${book.status === 'Прочитана' ? 'checked' : ''}> Прочитана</label>
        <label style="margin-left:12px"><input type="radio" name="b-status" value="Не прочитана" ${book.status !== 'Прочитана' ? 'checked' : ''}> Не прочитана</label>
      </div>
    </label>
    <div class="actions">
      <button onclick="closeModal()">Отмена</button>
      <button onclick="saveBook(${editId || null})">Сохранить</button>
    </div>
  `;
  
  openModal(modalHtml);
}

function saveBook(editId) {
  const t = document.getElementById('b-title').value.trim();
  const a = document.getElementById('b-author').value.trim();
  const g = document.getElementById('b-genre').value;
  const y = +document.getElementById('b-year').value;
  const s = document.querySelector('input[name="b-status"]:checked')?.value;
  
  if (!t || !a || !g || !s || !y) {
    showNotif('Заполните все поля', true);
    return;
  }
  
  if (editId) {
    let book = books.find(b => b.id === editId);
    book.title = t;
    book.author = a;
    book.genre = g;
    book.status = s;
    book.year = y;
    showNotif('Книга обновлена');
  } else {
    books.push(new Book(t, a, g, s, y));
    showNotif('Книга добавлена');
  }
  
  saveBooks();
  closeModal();
  renderBooks();
}

function editBook(id) {
  openBookForm(id);
}

// --- Delete ---
function deleteBook(id) {
  if (!confirm('Удалить книгу?')) return;
  
  books = books.filter(b => b.id !== id);
  saveBooks();
  renderBooks();
  showNotif('Книга удалена');
}

// --- Modal ---
function openModal(html) {
  document.getElementById('modal').innerHTML = html;
  document.getElementById('modal-bg').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-bg').style.display = 'none';
  document.getElementById('modal').innerHTML = '';
}

document.getElementById('modal-bg').onclick = function(e) {
  if (e.target.id === 'modal-bg') closeModal();
};

// --- Reviews ---
function openReviewForm(bookId) {
  const modalHtml = `
    <h2>Оставить отзыв</h2>
    <label>Имя<input id="r-user"></label>
    <label>Отзыв<textarea id="r-text"></textarea></label>
    <label>Оценка
      <select id="r-rating">
        <option value="5">★★★★★</option>
        <option value="4">★★★★☆</option>
        <option value="3">★★★☆☆</option>
        <option value="2">★★☆☆☆</option>
        <option value="1">★☆☆☆☆</option>
      </select>
    </label>
    <div class="actions">
      <button onclick="closeModal()">Отмена</button>
      <button onclick="addReview(${bookId})">Добавить отзыв</button>
    </div>
  `;
  
  openModal(modalHtml);
}

function addReview(bookId) {
  const user = document.getElementById('r-user').value.trim();
  const text = document.getElementById('r-text').value.trim();
  const rating = +document.getElementById('r-rating').value;
  
  if (!user || !text || !rating) {
    showNotif('Заполните все поля', true);
    return;
  }
  
  let book = books.find(b => b.id === bookId);
  if (!book.reviews) book.reviews = [];
  
  book.reviews.push(new Review(user, text, rating));
  saveBooks();
  closeModal();
  renderBooks();
  showNotif('Отзыв добавлен');
}

function showReviews(bookId) {
  let book = books.find(b => b.id === bookId);
  
  if (!book || !book.reviews || !book.reviews.length) {
    openModal(`
      <h2>Отзывы</h2>
      <div>Пока нет отзывов</div>
      <div class="actions"><button onclick="closeModal()">Закрыть</button></div>
    `);
    return;
  }

  let sortField = 'date';
  let sortDir = 'desc';
  let sortToggleId = 'sort-toggle-' + Date.now();

  function render() {
    let reviews = book.reviews.slice();

    if (sortField === 'rating') {
      reviews.sort((a, b) => {
        return sortDir === 'asc' ? a.rating - b.rating : b.rating - a.rating;
      });
    } else if (sortField === 'date') {
      const parseDate = str => {
        const [dd, mm, yyyy] = str.split('.');
        return new Date(`${yyyy}-${mm}-${dd}`);
      };
      reviews.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const modalHtml = `
      <h2>Отзывы</h2>
      <div class="actions" style="margin-bottom: 12px;">
        <button id="sort-field-btn" class="sort-field-btn" 
          onclick="changeSortField('${sortField === 'date' ? 'rating' : 'date'}')">
          Сортировать по: ${sortField === 'date' ? 'Рейтингу' : 'Дате'}
        </button>
        <button id="${sortToggleId}" class="sort-toggle-btn ${sortDir}" 
          onclick="changeSortDir('${sortDir === 'asc' ? 'desc' : 'asc'}')">
          <span>${sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}</span>
          <span class="sort-icon"></span>
        </button>
      </div>
      <div class="reviews-list">
        ${reviews.map(r => `
          <div class="review-card">
            <div class="review-header">
              <span class="review-user">${r.user}</span>
              <span class="review-rating">
                ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
              </span>
              <span class="review-date">${r.date}</span>
            </div>
            <div class="review-text">${r.text}</div>
          </div>
        `).join('')}
      </div>
      <div class="actions">
        <button onclick="closeModal()">Закрыть</button>
      </div>
    `;
    
    document.getElementById('modal').innerHTML = modalHtml;
  }

  window.changeSortField = function(field) {
    sortField = field;
    render();
  };

  window.changeSortDir = function(direction) {
    sortDir = direction;
    render();
  };

  openModal('');
  setTimeout(render, 30);
}

// --- Filters ---
function openFilters() {
  const authors = ['all', ...new Set(books.map(book => book.author))];
  
  let modalHtml = `
    <h2>Фильтры</h2>
    <label>Жанр
      <select id="f-genre">
        <option value="all">Все</option>
        ${GENRES.map(g => `<option${filters.genre === g ? ' selected' : ''}>${g}</option>`).join('')}
      </select>
    </label>
    <label>Статус
      <select id="f-status">
        <option value="all">Все</option>
        <option value="Прочитана"${filters.status === 'Прочитана' ? ' selected' : ''}>Прочитана</option>
        <option value="Не прочитана"${filters.status === 'Не прочитана' ? ' selected' : ''}>Не прочитана</option>
      </select>
    </label>
    <label>Автор
      <select id="f-author">
        ${authors.map(a => `<option value="${a}"${filters.author === a ? ' selected' : ''}>${a === 'all' ? 'Все' : a}</option>`).join('')}
      </select>
    </label>
    <div class="actions">
      <button onclick="closeModal()">Отмена</button>
      <button onclick="applyFilters()">Применить</button>
      <button onclick="resetFilters()" style="background:#ccc;color:#333">Сбросить</button>
    </div>
  `;
  
  openModal(modalHtml);
}

function resetFilters() {
  filters = { genre: 'all', status: 'all', author: 'all' };
  closeModal();
  renderBooks();
}

function applyFilters() {
  filters = {
    genre: document.getElementById('f-genre').value,
    status: document.getElementById('f-status').value,
    author: document.getElementById('f-author').value
  };
  closeModal();
  renderBooks();
}

// --- INIT HANDLERS ---
document.getElementById('add-btn').onclick = () => openBookForm();
document.getElementById('filter-btn').onclick = () => openFilters();

// --- Первая загрузка ---
books = loadBooks();
if (Array.isArray(books) && books.length > 0) {
  renderBooks();
}