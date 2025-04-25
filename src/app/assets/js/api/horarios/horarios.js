document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  let currentMonth = today.getMonth(); // 0-11
  let currentYear = today.getFullYear();

  function renderCalendarPage() {
    const html = `
      <div id="calendar-card">
        <h2><i class="bi bi-calendar3 me-2"></i>Calendario</h2>
        <div class="calendar-header">
          <button id="prev-month">«</button>
          <span>${getMonthName(currentMonth)} ${currentYear}</span>
          <button id="next-month">»</button>
        </div>
        <div id="calendar">
          ${renderDays()}
          ${renderDates(currentMonth, currentYear)}
        </div>
      </div>
    `;

    document.getElementById("app").innerHTML = html;

    document.getElementById("prev-month").addEventListener("click", () => {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      renderCalendarPage();
    });

    document.getElementById("next-month").addEventListener("click", () => {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
      renderCalendarPage();
    });
  }

  function renderDays() {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map(day => `<div class="day">${day}</div>`).join('');
  }

  function renderDates(month, year) {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Ajustamos el offset para que el lunes sea el primer día
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const blanks = Array(offset).fill('<div class="date"></div>').join('');

    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const isToday = isCurrentMonth && day === today.getDate();
      return `<div class="date${isToday ? ' today' : ''}">${day}</div>`;
    }).join('');

    return blanks + days;
  }

  function getMonthName(monthIndex) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[monthIndex];
  }

  renderCalendarPage();
});
