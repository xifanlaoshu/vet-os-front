import { computed, onMounted, reactive } from 'vue';
import { devWarn } from '@/utils/devLog';

export type Battery = {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  [key: string]: any;
};

export const useBattery = () => {
  const battery = reactive<Battery>({
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
    level: 100,
  });

  const isSupported = navigator && 'getBattery' in navigator;

  const updateBattery = (target: Partial<Battery> = {}) => {
    for (const key in battery) {
      if (key in target)
        battery[key] = target[key];
    }
    battery.level = Number(battery.level || 0) * 100;
  };

  const calcDischargingTime = computed(() => {
    const hour = battery.dischargingTime / 3600;
    const minute = (battery.dischargingTime / 60) % 60;
    return `${~~hour}h ${~~minute}m`;
  });

  const batteryStatus = computed(() => {
    if (battery.charging && battery.level >= 100)
      return 'Full';
    if (battery.charging)
      return 'Charging';
    return 'Disconnected';
  });

  onMounted(async () => {
    const BatteryManager: Battery = (await (window.navigator as any).getBattery?.()) || {};
    updateBattery(BatteryManager);
    devWarn('Battery manager initialized.', BatteryManager);

    BatteryManager.onchargingchange = ({ target }) => {
      updateBattery(target);
      devWarn('Battery charging status changed.', target);
    };
    BatteryManager.onchargingtimechange = ({ target }) => {
      updateBattery(target);
      devWarn('Battery charging time changed.', target);
    };
    BatteryManager.ondischargingtimechange = ({ target }) => {
      updateBattery(target);
      devWarn('Battery discharging time changed.', target);
    };
    BatteryManager.onlevelchange = ({ target }) => {
      updateBattery(target);
      devWarn('Battery level changed.', target);
    };
  });

  return {
    battery,
    isSupported,
    batteryStatus,
    calcDischargingTime,
  } as const;
};
