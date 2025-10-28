const _this = {
  subscribe,
  time: "--:--",
  battery: "--%",
};

let onUpdate;
let hours, minutes;
let interval;

function subscribe(onUpdateFn) {
  onUpdate = onUpdateFn;
  clearInterval(interval);
  update();
  interval = setInterval(update, 1000);
}

function update() {
  $app.getImports().battery.getStatus({
    success(status) {
      _this.time = getTimeStr(new Date(Date.now() + 28800000));
      _this.battery = Math.round(status.level * 100) + "%";
    },
    complete: onUpdate,
  });
}

function getTimeStr(date) {
  hours = ("0" + date.getUTCHours()).slice(-2);
  minutes = ("0" + date.getUTCMinutes()).slice(-2);
  return hours + ":" + minutes;
}

export default _this;