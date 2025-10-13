import systemBattery from "@system.battery";

export default {
  subscribe,
}

let time = "--:--";
let battery = "--%";
let onUpdate;
let hours, minutes;

function subscribe(onUpdateFn) {
  onUpdate = onUpdateFn;
  update();
  setInterval(update, 1000);
}

function update() {
  systemBattery.getStatus({
    success: onSuccess,
    complete: onComplete,
  });
}

function onSuccess(status) {
  time = getTimeStr(new Date(Date.now() + 28800000));
  battery = Math.round(status.level * 100) + "%";
}

function onComplete() {
  onUpdate({ time, battery });
}

function getTimeStr(date) {
  hours = ("0" + date.getUTCHours()).slice(-2);
  minutes = ("0" + date.getUTCMinutes()).slice(-2);
  return hours + ":" + minutes;
}