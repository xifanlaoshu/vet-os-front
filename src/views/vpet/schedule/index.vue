<template>
  <div class="vpet-page">
    <a-card class="vpet-query-card" title="排班管理" :bordered="false">
      <a-form class="vpet-query-form vpet-schedule-query" layout="horizontal">
        <a-form-item label="排班月份">
          <a-date-picker v-model:value="selectedMonth" picker="month" format="YYYY-MM" />
        </a-form-item>
        <div class="vpet-query-actions">
          <a-space>
            <a-button type="primary" @click="loadMonthSchedule">查询</a-button>
            <a-button @click="resetMonth">本月</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card class="vpet-panel-card vpet-schedule-card" :bordered="false">
      <a-spin :spinning="loading">
        <div class="schedule-legend">
          <span class="schedule-legend__item"><span class="schedule-legend__dot is-rest" />周末/法定假日</span>
          <span v-for="shift in shifts" :key="shift.id" class="schedule-legend__item">
            <span class="schedule-legend__dot" :style="{ background: shift.color || '#1677ff' }" />
            {{ shift.name }} {{ timeRange(shift) }}
          </span>
        </div>

        <div class="schedule-grid-scroll">
          <div class="schedule-grid" :style="scheduleGridStyle">
            <div class="schedule-grid__staff-head">医护人员</div>
            <div
              v-for="day in monthDays"
              :key="day.date"
              class="schedule-grid__day-head"
              :class="{ 'is-rest-day': isRestDay(day.date) }"
            >
              <strong>{{ day.dayLabel }}</strong>
              <span>{{ day.weekLabel }}</span>
            </div>

            <template v-for="doctor in doctors" :key="doctor.id">
              <div class="schedule-grid__staff-cell">
                <strong>{{ doctor.name }}</strong>
                <span>{{ [doctor.position, doctor.title].filter(Boolean).join(' / ') || '-' }}</span>
              </div>
              <div
                v-for="day in monthDays"
                :key="`${doctor.id}-${day.date}`"
                class="schedule-grid__cell"
                :class="{ 'is-rest-day': isRestDay(day.date) }"
              >
                <a-select
                  :value="scheduleValue(doctor.id, day.date)"
                  allow-clear
                  size="small"
                  :options="shiftOptions"
                  :placeholder="'选择班次'"
                  :dropdown-match-select-width="false"
                  @change="(value: any) => saveCell(doctor.id, day.date, value)"
                >
                  <template #option="{ label, color, time }">
                    <span class="schedule-option">
                      <span class="schedule-legend__dot" :style="{ background: color }" />
                      {{ label }} <small>{{ time }}</small>
                    </span>
                  </template>
                </a-select>
              </div>
            </template>
          </div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs';
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { vpetScheduleMonth, vpetScheduleSave } from '@/api/backend/vpet';

defineOptions({ name: 'VPetSchedule' });

type ShiftRecord = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
};

type DoctorRecord = {
  id: number;
  name: string;
  position?: string;
  title?: string;
};

type ScheduleRecord = {
  id: number;
  doctorId: number;
  scheduleDate: string;
  shiftId?: number;
};

const loading = ref(false);
const selectedMonth = ref<Dayjs>(dayjs());
const doctors = ref<DoctorRecord[]>([]);
const shifts = ref<ShiftRecord[]>([]);
const schedules = ref<ScheduleRecord[]>([]);

const holidaySet2026 = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
]);

const adjustedWorkdaySet2026 = new Set(['2026-02-14', '2026-02-28', '2026-04-26', '2026-05-09', '2026-09-20', '2026-10-10']);

const monthDays = computed(() => {
  const start = selectedMonth.value.startOf('month');
  return Array.from({ length: selectedMonth.value.daysInMonth() }, (_, index) => {
    const current = start.add(index, 'day');
    return {
      date: current.format('YYYY-MM-DD'),
      dayLabel: current.format('MM/DD'),
      weekLabel: ['日', '一', '二', '三', '四', '五', '六'][current.day()],
    };
  });
});

const scheduleGridStyle = computed(() => ({
  gridTemplateColumns: `180px repeat(${monthDays.value.length}, 92px)`,
}));

const shiftOptions = computed(() => shifts.value.map(shift => ({
  value: shift.id,
  label: shift.name,
  color: shift.color || '#1677ff',
  time: timeRange(shift),
})));

const scheduleMap = computed(() => {
  const map = new Map<string, ScheduleRecord>();
  schedules.value.forEach((item) => {
    map.set(`${item.doctorId}_${dayjs(item.scheduleDate).format('YYYY-MM-DD')}`, item);
  });
  return map;
});

function isRestDay(date: string) {
  if (adjustedWorkdaySet2026.has(date)) return false;
  const day = dayjs(date).day();
  return holidaySet2026.has(date) || day === 0 || day === 6;
}

function timeRange(shift: ShiftRecord) {
  return `${(shift.startTime || '').slice(0, 5)}-${(shift.endTime || '').slice(0, 5)}`;
}

function scheduleValue(doctorId: number, date: string) {
  return scheduleMap.value.get(`${doctorId}_${date}`)?.shiftId;
}

async function loadMonthSchedule() {
  loading.value = true;
  try {
    const res: any = await vpetScheduleMonth({ month: selectedMonth.value.format('YYYY-MM') });
    doctors.value = res?.doctors || [];
    shifts.value = res?.shifts || [];
    schedules.value = res?.schedules || [];
  } finally {
    loading.value = false;
  }
}

async function saveCell(doctorId: number, scheduleDate: string, shiftId?: number) {
  const saved: any = await vpetScheduleSave({ doctorId, scheduleDate, shiftId: shiftId || null });
  const key = `${doctorId}_${scheduleDate}`;
  const next = schedules.value.filter(item => `${item.doctorId}_${dayjs(item.scheduleDate).format('YYYY-MM-DD')}` !== key);
  if (shiftId) next.push(saved || { id: Date.now(), doctorId, scheduleDate, shiftId });
  schedules.value = next;
  message.success('排班已保存');
}

function resetMonth() {
  selectedMonth.value = dayjs();
  loadMonthSchedule();
}

onMounted(loadMonthSchedule);
</script>

<style scoped lang="less">
.vpet-schedule-query {
  grid-template-columns: minmax(220px, 320px) 1fr;
}

.vpet-schedule-card {
  overflow: visible;
}

.schedule-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 15px;
  color: #475467;
  font-size: 12px;
}

.schedule-legend__item,
.schedule-option {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.schedule-option small {
  color: #98a2b3;
}

.schedule-legend__dot {
  width: 12px;
  height: 12px;
  flex: none;
  border-radius: 3px;
  background: #1677ff;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);
}

.schedule-legend__dot.is-rest {
  background: #fff1f0;
  box-shadow: inset 0 0 0 1px #ffa39e;
}

.schedule-grid-scroll {
  width: 100%;
  overflow: auto;
  border: 1px solid #edf0f5;
  border-radius: 14px;
}

.schedule-grid {
  display: grid;
  min-width: max-content;
  background: #fff;
}

.schedule-grid__staff-head,
.schedule-grid__day-head,
.schedule-grid__staff-cell,
.schedule-grid__cell {
  border-right: 1px solid #edf0f5;
  border-bottom: 1px solid #edf0f5;
}

.schedule-grid__staff-head,
.schedule-grid__day-head {
  position: sticky;
  top: 0;
  z-index: 3;
  min-height: 52px;
  background: #f8fafc;
}

.schedule-grid__staff-head,
.schedule-grid__staff-cell {
  position: sticky;
  left: 0;
  z-index: 4;
  background: #fbfcfe;
}

.schedule-grid__staff-head {
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: #24324b;
  font-weight: 700;
}

.schedule-grid__day-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #344054;
}

.schedule-grid__day-head span {
  color: #667085;
  font-size: 12px;
}

.schedule-grid__day-head.is-rest-day,
.schedule-grid__cell.is-rest-day {
  background: #fff7e6;
}

.schedule-grid__staff-cell {
  display: flex;
  min-height: 54px;
  flex-direction: column;
  justify-content: center;
  padding: 8px 14px;
}

.schedule-grid__staff-cell span {
  margin-top: 3px;
  color: #667085;
  font-size: 12px;
}

.schedule-grid__cell {
  display: flex;
  min-height: 54px;
  align-items: center;
  padding: 8px;
}

.schedule-grid__cell :deep(.ant-select) {
  width: 100%;
}
</style>
