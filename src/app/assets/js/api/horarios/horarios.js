document.addEventListener("DOMContentLoaded", () => {
    renderCalendarPage();
  });
  
  function renderCalendarPage() {
    const html = `
      <div id="calendar-card">
        <h2><i class="bi bi-calendar3 me-2"></i>Calendario</h2>
        <div id="calendar">
          ${renderDays()}
          ${renderDates()}
        </div>
      </div>
    `;
  
    document.getElementById("app").innerHTML = html;
  }
  
  function renderDays() {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map(day => `<div class="day">${day}</div>`).join('');
  }
  
  function renderDates() {
    const totalDays = 31; 
    const offset = 1; 
    const blanks = Array(offset).fill('<div class="date"></div>').join('');
    const days = Array.from({ length: totalDays }, (_, i) =>
      `<div class="date">${i + 1}</div>`
    ).join('');
    return blanks + days;
  }
  