/** 
 * Функция для получения следующего случайного объекта без повторов.
 * @param {Array} currentPool - Текущий остаток объектов (стейт pool).
 * @param {Array} allTasks - Исходный массив всех объектов (константа с фразами).
 * @returns {Object} { selectedItem: объект, newPool: обновленный массив }
 */
const getRandomObjTask = (currentPool, allTasks) => {
  // 1. Создаем рабочую копию пула. 
  // Если пул пуст (начало игры или все фразы закончились), берем все данные из исходного массива.
  let newPool = currentPool.length > 0 ? [...currentPool] : [...allTasks];

  // 2. Генерируем случайный индекс в диапазоне текущего пула
  const randomIndex = Math.floor(Math.random() * newPool.length);

  // 3. Извлекаем (вырезаем) элемент из массива по индексу.
  // splice возвращает массив с удаленными элементами, поэтому используем деструктуризацию [selectedItem], чтобы достать сам объект. Теперь в newPool на один элемент меньше.
  const [selectedItem] = newPool.splice(randomIndex, 1);

  // 4. Возвращаем выбранный объект для отображения и обновленный пул для сохранения в стейт.
  return { selectedItem, newPool };
};

export {getRandomObjTask}