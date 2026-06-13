<template>
  <div class="vpet-page vpet-stack">
    <a-page-header
      :title="pageTitle"
      :subtitle="currentVisit?.visitNo || '-'"
      @back="router.back()"
    >
      <template #extra>
        <a-space>
          <a-tag :color="visitStatusColor(currentVisit?.status)">
            {{ visitStatusText(currentVisit?.status) }}
          </a-tag>
          <a-button :disabled="!currentVisit?.petId" @click="openChronicCenter">
            {{ t('page.chronic.title') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id" @click="openPrintRecord">
            {{ t('page.consultation.print.printButton') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id" @click="syncBilling">
            {{ t('page.consultation.detail.syncBilling') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id || isVisitLocked" @click="lockEmr">
            {{ t('page.consultation.detail.lockEmr') }}
          </a-button>
          <a-button :disabled="!currentVisit?.id || isVisitLocked" @click="signEmr">
            {{ t('page.consultation.detail.signEmr') }}
          </a-button>
          <a-button v-if="isVisitLocked" @click="requestUnlockEmr">
            {{ t('page.consultation.detail.requestUnlock') }}
          </a-button>
          <a-button type="primary" :disabled="!canEditVisit" @click="saveSoap">
            {{ t('page.consultation.detail.saveRecord') }}
          </a-button>
          <a-button v-if="canEndVisit" danger @click="endVisit">
            {{ t('page.consultation.detail.endVisit') }}
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic :title="t('page.consultation.detail.queueNumber')" :value="currentVisit?.queueNumber || '-'" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic
            :title="t('page.consultation.detail.startTime')"
            :value="currentVisit?.startTime ? formatToDateTime(currentVisit.startTime) : '-'"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic
            :title="t('page.consultation.detail.receivable')"
            :value="billingReceivableTotal.toFixed(2)"
            :suffix="t('common.amountUnit')"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="vpet-stat-card">
          <a-statistic
            :title="t('page.consultation.detail.due')"
            :value="billingDueTotal.toFixed(2)"
            :suffix="t('common.amountUnit')"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="vpet-grid-row">
      <a-col :span="16" class="vpet-stack">
        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.soap')">
          <a-form layout="vertical">
            <a-form-item :label="t('page.consultation.detail.subjective')">
              <a-textarea v-model:value="soap.S" :rows="3" :disabled="!canEditVisit" />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.objective')">
              <a-textarea v-model:value="soap.O" :rows="4" :disabled="!canEditVisit" />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.assessment')">
              <a-select
                v-model:value="soap.diagnosisCode"
                show-search
                allow-clear
                :disabled="!canEditVisit"
                :filter-option="false"
                :options="diagnosisOptions"
                :placeholder="t('page.consultation.detail.diagnosisPlaceholder')"
                @search="handleDiagnosisSearch"
                @change="handleDiagnosisChange"
              />
            </a-form-item>
            <a-form-item :label="t('page.consultation.detail.plan')">
              <a-textarea v-model:value="soap.P" :rows="4" :disabled="!canEditVisit" />
            </a-form-item>
          </a-form>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.continuousCare')">
          <template #extra>
            <a-space>
              <a-tag color="blue">{{ careFollowups.length }}</a-tag>
              <a-button type="link" size="small" @click="continuousCareExpanded = !continuousCareExpanded">
                {{ continuousCareExpanded ? t('page.consultation.detail.collapseContinuousCare') : t('page.consultation.detail.expandContinuousCare') }}
              </a-button>
            </a-space>
          </template>
          <template v-if="continuousCareExpanded">
            <a-alert
              type="info"
              show-icon
              class="vpet-block-bottom"
              :message="t('page.consultation.detail.continuousCareHint')"
            />
            <a-form layout="vertical">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item :label="t('page.consultation.detail.symptomObservation')">
                    <a-textarea v-model:value="careFollowupForm.symptomSummary" :rows="3" :disabled="!canEditVisit" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="t('page.consultation.detail.statusObservation')">
                    <a-textarea v-model:value="careFollowupForm.statusSummary" :rows="3" :disabled="!canEditVisit" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="6">
                  <a-form-item :label="t('page.consultation.detail.temperature')">
                    <a-input-number v-model:value="careFollowupForm.temperature" :min="0" :precision="1" :disabled="!canEditVisit" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item :label="t('page.consultation.detail.heartRate')">
                    <a-input-number v-model:value="careFollowupForm.heartRate" :min="0" :precision="0" :disabled="!canEditVisit" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item :label="t('page.consultation.detail.respiratoryRate')">
                    <a-input-number v-model:value="careFollowupForm.respiratoryRate" :min="0" :precision="0" :disabled="!canEditVisit" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="6">
                  <a-form-item :label="t('page.consultation.detail.weight')">
                    <a-input-number v-model:value="careFollowupForm.weight" :min="0" :precision="2" :disabled="!canEditVisit" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item :label="t('page.consultation.detail.objectiveObservation')">
                <a-textarea v-model:value="careFollowupForm.objectiveNote" :rows="2" :disabled="!canEditVisit" />
              </a-form-item>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item :label="t('page.consultation.detail.followupAssessment')">
                    <a-textarea v-model:value="careFollowupForm.assessmentText" :rows="3" :disabled="!canEditVisit" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="t('page.consultation.detail.planAdjustment')">
                    <a-textarea v-model:value="careFollowupForm.planAdjustment" :rows="3" :disabled="!canEditVisit" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-form-item :label="t('page.consultation.detail.medicationAdjustment')">
                <a-textarea v-model:value="careFollowupForm.medicationAdjustment" :rows="2" :disabled="!canEditVisit" />
              </a-form-item>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item :label="t('page.consultation.detail.linkedLabs')">
                    <a-select
                      v-model:value="careFollowupForm.labOrderIds"
                      mode="multiple"
                      allow-clear
                      :disabled="!canEditVisit"
                      :options="careLabOptions"
                      :placeholder="t('page.consultation.detail.linkedLabsPlaceholder')"
                    />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item :label="t('page.consultation.detail.linkedPrescriptions')">
                    <a-select
                      v-model:value="careFollowupForm.prescriptionIds"
                      mode="multiple"
                      allow-clear
                      :disabled="!canEditVisit"
                      :options="carePrescriptionOptions"
                      :placeholder="t('page.consultation.detail.linkedPrescriptionsPlaceholder')"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-button type="primary" :disabled="!canEditVisit" @click="submitCareFollowup">
                {{ t('page.consultation.detail.addCareFollowup') }}
              </a-button>
            </a-form>

            <a-divider />
            <a-empty v-if="careFollowups.length === 0" :description="t('page.consultation.detail.emptyCareFollowups')" />
            <a-timeline v-else>
            <a-timeline-item v-for="item in careFollowups" :key="item.id">
              <div class="vpet-subtitle">
                {{ item.batchNo }} / {{ formatToDateTime(item.occurredAt) }}
                / {{ t('page.consultation.detail.recordedBy') }} {{ staffLabel(item.recorder, item.recordedBy) }}
              </div>
              <div class="vpet-inline-note">{{ item.symptomSummary || '-' }}</div>
              <div class="vpet-muted vpet-inline-note">{{ item.statusSummary || '-' }}</div>
              <div v-if="vitalSignText(item.vitalSigns)" class="vpet-inline-note">
                {{ vitalSignText(item.vitalSigns) }}
              </div>
              <div v-if="item.objectiveNote" class="vpet-muted vpet-inline-note">{{ item.objectiveNote }}</div>
              <div v-if="item.assessmentText" class="vpet-inline-note">{{ t('page.consultation.detail.followupAssessment') }}：{{ item.assessmentText }}</div>
              <div v-if="item.planAdjustment" class="vpet-inline-note">{{ t('page.consultation.detail.planAdjustment') }}：{{ item.planAdjustment }}</div>
              <div v-if="item.medicationAdjustment" class="vpet-inline-note">{{ t('page.consultation.detail.medicationAdjustment') }}：{{ item.medicationAdjustment }}</div>
              <div v-if="(item.linkedLabs || []).length" class="vpet-block-top">
                <div class="vpet-subtitle-spaced">{{ t('page.consultation.detail.linkedLabs') }}</div>
                <div v-for="lab in item.linkedLabs || []" :key="lab.id" class="vpet-list-row">
                  <a-button type="link" style="padding: 0" @click="openLabReport(lab.id)">
                    {{ lab.orderNo }} / {{ lab.testName }}
                  </a-button>
                  <div class="vpet-muted">{{ labResultSummary(lab) }}</div>
                </div>
              </div>
              <div v-if="(item.linkedPrescriptions || []).length" class="vpet-block-top">
                <div class="vpet-subtitle-spaced">{{ t('page.consultation.detail.linkedPrescriptions') }}</div>
                <div v-for="rx in item.linkedPrescriptions || []" :key="rx.id" class="vpet-list-row">
                  <div class="vpet-subtitle">{{ rx.rxNo }}{{ rx.batchNo ? ` / ${rx.batchNo}` : '' }}</div>
                  <div class="vpet-muted">{{ prescriptionBrief(rx) }}</div>
                </div>
              </div>
              </a-timeline-item>
            </a-timeline>
          </template>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.media')">
          <template #extra>
            <a-button type="primary" size="small" :disabled="!canEditVisit" @click="openMediaBatchModal">
              {{ t('page.consultation.detail.addMediaBatch') }}
            </a-button>
          </template>
          <a-alert
            type="info"
            show-icon
            class="vpet-block-bottom"
            :message="t('page.consultation.detail.mediaHint')"
          />
          <a-empty v-if="mediaBatches.length === 0" :description="t('page.consultation.detail.emptyMediaBatches')" />
          <div v-else class="vpet-media-batches">
            <div v-for="batch in mediaBatches" :key="batch.id" class="vpet-media-batch">
              <div class="vpet-media-batch__head">
                <div>
                  <div class="vpet-subtitle">
                    {{ batch.batchNo }} / {{ formatToDateTime(batch.capturedAt) }}
                  </div>
                  <div class="vpet-muted">
                    {{ mediaRelationText(batch) }} / {{ t('page.consultation.detail.operator') }} {{ staffLabel(batch.operator, batch.operatorId) }}
                  </div>
                  <div v-if="batch.remark" class="vpet-muted">{{ batch.remark }}</div>
                </div>
                <a-upload
                  multiple
                  accept="image/*,video/*"
                  :show-upload-list="false"
                  :disabled="!canEditVisit || uploadingMediaBatchId === batch.id"
                  :before-upload="(file: any) => uploadMediaFile(batch, file)"
                >
                  <a-button size="small" :loading="uploadingMediaBatchId === batch.id">
                    {{ t('page.consultation.detail.uploadMedia') }}
                  </a-button>
                </a-upload>
              </div>
              <div v-if="(batch.files || []).length" class="vpet-media-files">
                <div v-for="file in batch.files || []" :key="file.id" class="vpet-media-file">
                  <button class="vpet-media-file__preview" type="button" @click="openMediaPreview(file)">
                    <img
                      v-if="file.fileType === 'image'"
                      :src="mediaThumbnailDisplayUrl(file)"
                      :alt="file.originalName || file.fileName || batch.batchNo"
                      @error="refreshMediaFileThumbnailDisplayUrl(file, true)"
                    />
                    <video v-else-if="file.fileType === 'video'" :src="mediaDisplayUrl(file.url)" muted preload="metadata" />
                    <div v-else class="vpet-media-file__placeholder">
                      {{ file.originalName || file.fileName || file.url }}
                    </div>
                  </button>
                  <div class="vpet-media-file__meta">
                    <span>{{ file.originalName || file.fileName || '-' }}</span>
                    <span>{{ file.storageType?.toUpperCase?.() || '-' }} / {{ fileSizeText(file.fileSize) }}</span>
                    <a-space size="small">
                      <a-button type="link" size="small" @click="openMediaPreview(file)">
                        {{ t('page.consultation.detail.previewMedia') }}
                      </a-button>
                      <a-button
                        type="link"
                        size="small"
                        :loading="downloadingMediaFileId === file.id"
                        @click="downloadMediaFile(file)"
                      >
                        {{ t('page.consultation.detail.downloadMedia') }}
                      </a-button>
                    </a-space>
                  </div>
                </div>
              </div>
              <a-empty v-else :description="t('page.consultation.detail.emptyMediaFiles')" />
            </div>
          </div>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.prescription')">
          <a-alert
            type="info"
            show-icon
            class="vpet-block-bottom"
            :message="t('page.consultation.detail.prescriptionSummary', {
              count: prescriptions.length,
              dispensed: dispensedPrescriptionCount,
            })"
          />
          <a-select
            v-model:value="selectedPrescriptionTemplateId"
            allow-clear
            mode="multiple"
            show-search
            :disabled="!canEditVisit"
            :filter-option="filterByLabel"
            :options="prescriptionTemplateOptions"
            :placeholder="t('page.prescription.placeholders.template')"
            class="vpet-block-bottom"
            style="width: 100%"
            @change="applyPrescriptionTemplate"
          />
          <a-input
            v-model:value="rxForm.diagnosisSummary"
            :disabled="!canEditVisit"
            :placeholder="t('page.consultation.detail.diagnosisSummaryPlaceholder')"
            class="vpet-block-bottom"
          />

          <a-table
            class="vpet-rx-edit-table"
            row-key="rowKey"
            size="small"
            :pagination="false"
            :columns="rxDetailInputColumns"
            :data-source="rxForm.details"
            :scroll="{ x: 1400 }"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'item'">
                <a-select
                  v-model:value="record.itemSelectValue"
                  show-search
                  :disabled="!canEditVisit"
                  :filter-option="false"
                  :options="chargeableOptions"
                  :placeholder="t('page.consultation.detail.drugPlaceholder')"
                  style="width: 100%"
                  @search="handleChargeableSearch"
                  @change="(value) => handleChargeableChange(index, value)"
                />
              </template>
              <template v-else-if="column.key === 'specification'">
                <a-input :value="record.specification || '-'" disabled />
              </template>
              <template v-else-if="column.key === 'dosage'">
                <a-input
                  v-model:value="record.dosage"
                  :disabled="!canEditVisit"
                  :placeholder="t('page.consultation.detail.dosage')"
                />
              </template>
              <template v-else-if="column.key === 'frequency'">
                <a-input
                  v-model:value="record.frequency"
                  :disabled="!canEditVisit"
                  :placeholder="t('page.consultation.detail.frequency')"
                />
              </template>
              <template v-else-if="column.key === 'quantity'">
                <a-input-number
                  v-model:value="record.quantity"
                  :min="0.01"
                  :precision="2"
                  :disabled="!canEditVisit"
                  style="width: 100%"
                />
              </template>
              <template v-else-if="column.key === 'dosageUnit'">
                <a-input :value="record.dosageUnit || '-'" disabled />
              </template>
              <template v-else-if="column.key === 'unitPrice'">
                <a-input-number
                  v-model:value="record.unitPrice"
                  :min="0"
                  :disabled="!canEditVisit"
                  style="width: 100%"
                />
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button type="link" danger :disabled="!canEditVisit" @click="removeRxDetail(index)">
                  {{ t('common.delete') }}
                </a-button>
              </template>
            </template>
          </a-table>

          <a-space class="vpet-block-top">
            <a-button :disabled="!canEditVisit" @click="addRxDetail">
              {{ t('page.consultation.detail.addDrug') }}
            </a-button>
            <a-button type="primary" :disabled="!canEditVisit" @click="submitRx">
              {{ t('page.consultation.detail.submitPrescription') }}
            </a-button>
          </a-space>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.prescriptionAndDispense')">
          <a-empty v-if="prescriptions.length === 0" :description="t('page.consultation.detail.emptyPrescription')" />
          <a-collapse v-else>
            <a-collapse-panel
              v-for="item in prescriptions"
              :key="item.id"
              :header="`${item.rxNo}${item.batchNo ? ` / ${item.batchNo}` : ''} / ${Number(item.totalAmount || 0).toFixed(2)} ${t('common.amountUnit')}`"
            >
              <template #extra>
                <a-space>
                  <a-tag :color="prescriptionStatusColor(item.status)">
                    {{ prescriptionStatusText(item.status) }}
                  </a-tag>
                  <a-button
                    v-if="Number(item.status) !== 4 && Number(item.status) !== 5"
                    type="link"
                    size="small"
                    @click.stop="dispensePrescription(item)"
                  >
                    {{ t('page.consultation.detail.dispense') }}
                  </a-button>
                </a-space>
              </template>

              <div
                v-for="detail in item.details || []"
                :key="detail.id"
                class="vpet-list-row"
              >
                <div class="vpet-subtitle">{{ detail.drugName }}</div>
                <div class="vpet-muted">
                  {{ [detail.specification, detail.dosage, detail.frequency, `x${detail.quantity || 0}${detail.dosageUnit || ''}`].filter(Boolean).join(' / ') }}
                </div>
              </div>

              <a-descriptions :column="2" size="small" class="vpet-block-spaced">
                <a-descriptions-item :label="t('page.consultation.detail.prescriber')">
                  {{ staffLabel(item.doctor, item.doctorId, item.doctorSnapshot?.name) }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.consultation.detail.pharmacist')">
                  {{ staffLabel(item.pharmacist, item.pharmacistId) }}
                </a-descriptions-item>
              </a-descriptions>

              <div class="vpet-block-spaced">
                <div class="vpet-subtitle-spaced">
                  {{ t('page.consultation.detail.transactionList') }}
                </div>
                <a-empty
                  v-if="!(prescriptionTxnsMap[item.id] || []).length"
                  :description="t('page.consultation.detail.emptyTransactions')"
                  :image="false"
                />
                <a-timeline v-else size="small">
                  <a-timeline-item
                    v-for="txn in prescriptionTxnsMap[item.id] || []"
                    :key="txn.id"
                  >
                    {{ drugLabel(txn.drug, txn.drugName, txn.drugId) }}
                    {{ Number(txn.quantityChange || 0) < 0 ? t('page.consultation.detail.dispense') : t('page.pharmacy.stockIn') }}
                    {{ Math.abs(Number(txn.quantityChange || 0)).toFixed(2) }}
                    / {{ t('page.pharmacy.fields.batchNo') }} {{ txn.batch?.batchNo || '-' }}
                    / {{ t('common.updatedAt') }} {{ formatToDateTime(txn.txnTime) }}
                    / {{ t('page.consultation.detail.operator') }} {{ staffLabel(txn.operator, txn.operatorId) }}
                  </a-timeline-item>
                </a-timeline>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>

      <a-col :span="8" class="vpet-stack">
        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.visitInfo')">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('page.appointment.fields.customer')">
              {{ customerLabel(currentVisit?.customer, currentVisit?.customerSnapshot, currentVisit?.customerId) }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.appointment.fields.pet')">
              {{ petSummary }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.fields.chiefComplaint')">
              {{ currentVisit?.chiefComplaint || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.fields.diagnosis')">
              {{ diagnosisSummary || '-' }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.detail.doctor')">
              {{ doctorDisplay }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.detail.memberBalance')">
              {{ memberBalanceText }}
            </a-descriptions-item>
          </a-descriptions>
          <a-divider v-if="diagnosisTraceItems.length" style="margin: 12px 0" />
          <div v-if="diagnosisTraceItems.length" class="vpet-section-title">
            {{ t('page.consultation.detail.diagnosisTrace') }}
          </div>
          <a-timeline v-if="diagnosisTraceItems.length" size="small">
            <a-timeline-item v-for="item in diagnosisTraceItems" :key="item.id || item.code || item.name">
              <div class="vpet-subtitle">{{ item.name || item.code || '-' }}</div>
              <div class="vpet-muted">
                {{ t('page.consultation.detail.recordedBy') }} {{ staffLabel(item.recorder, item.recordedBy) }}
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.emrCompliance')">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="t('page.consultation.detail.emrLockStatus')">
              <a-tag :color="isVisitLocked ? 'red' : 'green'">
                {{ isVisitLocked ? t('page.consultation.detail.locked') : t('page.consultation.detail.unlocked') }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('page.consultation.detail.signatureCount')">
              {{ emrSignatures.length }}
            </a-descriptions-item>
          </a-descriptions>
          <a-divider style="margin: 12px 0" />
          <div class="vpet-section-title">{{ t('page.consultation.detail.auditLogs') }}</div>
          <a-empty v-if="!emrAuditLogs.length" :description="t('page.consultation.detail.emptyAuditLogs')" :image="false" />
          <a-timeline v-else size="small">
            <a-timeline-item v-for="log in emrAuditLogs" :key="log.id">
              <div class="vpet-subtitle">{{ emrAuditActionText(log.action) }} / {{ formatToDateTime(log.createdAt) }}</div>
              <div class="vpet-muted">
                {{ t('page.consultation.detail.operator') }} {{ staffLabel(log.operator, log.operatorId) }}
              </div>
              <div class="vpet-muted">{{ log.reason || '-' }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.chronic.title')">
          <template #extra>
            <a-button size="small" @click="openChronicCenter">
              {{ t('common.detail') }}
            </a-button>
          </template>
          <a-empty
            v-if="!chronicCases.length"
            :description="t('page.chronic.emptyCases')"
            :image="false"
          />
          <a-timeline v-else size="small">
            <a-timeline-item
              v-for="item in chronicCases"
              :key="item.id"
            >
              <a-button type="link" style="padding: 0" @click="openChronicCase(item.id)">
                {{ item.caseNo }} / {{ item.diseaseName }}
              </a-button>
              <div class="vpet-muted">{{ item.nextReviewDate || '-' }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.queueTrace')">
          <a-empty
            v-if="!(currentVisit?.queueEvents || []).length"
            :description="t('page.consultation.detail.emptyQueueEvents')"
            :image="false"
          />
          <a-timeline v-else size="small">
            <a-timeline-item
              v-for="event in currentVisit?.queueEvents || []"
              :key="event.id"
            >
              {{ queueEventText(event.eventType) }} / {{ formatToDateTime(event.eventTime) }}
            </a-timeline-item>
          </a-timeline>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.consultation.detail.billingAndPayments')">
          <a-empty v-if="billings.length === 0" :description="t('page.consultation.detail.emptyBills')" />
          <a-collapse v-else>
            <a-collapse-panel
              v-for="bill in billings"
              :key="bill.id"
              :header="`${bill.billNo} / ${t('page.consultation.detail.receivable')} ${billReceivable(bill).toFixed(2)} ${t('common.amountUnit')}`"
            >
              <template #extra>
                <a-space>
                  <a-tag :color="paymentStatusColor(bill.paymentStatus)">
                    {{ paymentStatusText(bill.paymentStatus) }}
                  </a-tag>
                  <a-button
                    v-if="billDue(bill) > 0"
                    type="link"
                    size="small"
                    @click.stop="openPayModal(bill)"
                  >
                    {{ t('page.consultation.detail.pay') }}
                  </a-button>
                </a-space>
              </template>

              <div class="vpet-block-bottom">
                <div
                  v-for="detail in bill.details || []"
                  :key="detail.id"
                  class="vpet-flex-between-spaced"
                >
                  <span>{{ detail.itemName }}</span>
                  <span>{{ Number(detail.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}</span>
                </div>
              </div>

              <a-divider style="margin: 12px 0" />
              <div class="vpet-subtitle-spaced">{{ t('page.billing.paymentRecords') }}</div>
              <a-empty
                v-if="!(bill.payments || []).length"
                :description="t('page.consultation.detail.emptyPayments')"
                :image="false"
              />
              <a-timeline v-else size="small">
                <a-timeline-item
                  v-for="payment in bill.payments || []"
                  :key="payment.id"
                >
                  {{ paymentMethodText(payment.paymentMethod) }}
                  {{ Number(payment.amount || 0).toFixed(2) }} {{ t('common.amountUnit') }}
                  / {{ formatToDateTime(payment.paidAt) }}
                </a-timeline-item>
              </a-timeline>
            </a-collapse-panel>
          </a-collapse>
        </a-card>

        <a-card class="vpet-detail-card" :title="t('page.lab.title')">
          <template #extra>
            <a-button size="small" @click="openLabCreateModal">
              {{ t('page.lab.create') }}
            </a-button>
          </template>
          <a-empty v-if="labs.length === 0" :description="t('page.consultation.detail.emptyPrescription')" />
          <a-collapse v-else>
            <a-collapse-panel
              v-for="lab in labs"
              :key="lab.id"
              :header="`${lab.orderNo} / ${lab.testName || '-'}`"
            >
              <template #extra>
                <a-space>
                  <a-tag :color="labStatusColor(lab.status)">
                    {{ labStatusText(lab.status) }}
                  </a-tag>
                  <a-button type="link" size="small" @click.stop="openLabReport(lab.id)">
                    {{ t('page.lab.report') }}
                  </a-button>
                </a-space>
              </template>

              <a-descriptions :column="1" size="small">
                <a-descriptions-item :label="t('page.lab.fields.sampleType')">
                  {{ lab.sampleType || '-' }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.lab.fields.abnormalCount')">
                  {{ Number(lab.abnormalCount || 0) }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.billing.fields.amount')">
                  {{ Number(lab.chargeAmount || 0).toFixed(2) }} {{ t('common.amountUnit') }}
                </a-descriptions-item>
                <a-descriptions-item :label="t('page.lab.fields.reportSummary')">
                  {{ lab.reportSummary || '-' }}
                </a-descriptions-item>
              </a-descriptions>

              <div class="vpet-block-spaced">
                <div
                  v-for="result in lab.resultItems || []"
                  :key="result.id"
                  class="vpet-result-row"
                >
                  <span>{{ result.itemName }}</span>
                  <span>{{ [result.resultValue, result.unit, result.flag].filter(Boolean).join(' / ') || '-' }}</span>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-card>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="payVisible"
      :title="t('page.consultation.detail.confirmPayment')"
      :confirm-loading="paying"
      destroy-on-close
      @ok="submitPayment"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.billing.fields.billNo')">
          <a-input :value="payingBill?.billNo || '-'" disabled />
        </a-form-item>
        <a-form-item :label="t('page.appointment.fields.customer')">
          <a-input :value="customerLabel(currentVisit?.customer, currentVisit?.customerSnapshot, currentVisit?.customerId)" disabled />
        </a-form-item>
        <a-form-item :label="t('page.consultation.detail.memberBalance')">
          <a-input :value="memberBalanceText" disabled />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.paymentMethod')">
              <a-select v-model:value="payForm.paymentMethod" :options="paymentMethodOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item :label="t('page.billing.fields.paidAmount')">
              <a-input-number v-model:value="payForm.paidAmount" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="labCreateVisible"
      :title="t('page.lab.create')"
      destroy-on-close
      @ok="submitLabOrder"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.lab.fields.testName')">
          <a-select
            v-model:value="labCreateForm.templateId"
            allow-clear
            show-search
            :options="labTemplateOptions"
            :filter-option="filterByLabel"
            @change="handleLabTemplateChange"
          />
        </a-form-item>
        <a-form-item :label="t('page.lab.fields.testName')">
          <a-input v-model:value="labCreateForm.testName" />
        </a-form-item>
        <a-form-item :label="t('page.lab.fields.sampleType')">
          <a-select
            v-model:value="labCreateForm.sampleType"
            allow-clear
            show-search
            :options="sampleTypeOptions"
            :filter-option="filterByLabel"
          />
        </a-form-item>
        <a-form-item :label="t('page.billing.fields.amount')">
          <a-input-number v-model:value="labCreateForm.chargeAmount" :min="0" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="mediaBatchVisible"
      :title="t('page.consultation.detail.addMediaBatch')"
      destroy-on-close
      @ok="submitMediaBatch"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('page.consultation.detail.captureTime')">
          <a-input v-model:value="mediaBatchForm.capturedAt" type="datetime-local" />
        </a-form-item>
        <a-form-item :label="t('page.consultation.detail.relationType')">
          <a-select
            v-model:value="mediaBatchForm.relationType"
            :options="mediaRelationOptions"
            @change="mediaBatchForm.careFollowupId = undefined"
          />
        </a-form-item>
        <a-form-item
          v-if="mediaBatchForm.relationType === 'care_followup'"
          :label="t('page.consultation.detail.relationCareFollowup')"
        >
          <a-select
            v-model:value="mediaBatchForm.careFollowupId"
            allow-clear
            :options="mediaCareFollowupOptions"
            :placeholder="t('page.consultation.detail.relationCareFollowupPlaceholder')"
          />
        </a-form-item>
        <a-form-item :label="t('page.consultation.detail.mediaRemark')">
          <a-textarea v-model:value="mediaBatchForm.remark" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="mediaPreviewVisible"
      :title="mediaPreviewFile?.originalName || mediaPreviewFile?.fileName || t('page.consultation.detail.previewMedia')"
      width="860px"
      :footer="null"
      destroy-on-close
    >
      <div class="vpet-media-preview">
        <img
          v-if="mediaPreviewFile?.fileType === 'image'"
          :src="mediaPreviewUrl"
          :alt="mediaPreviewFile?.originalName || mediaPreviewFile?.fileName || ''"
        />
        <video
          v-else-if="mediaPreviewFile?.fileType === 'video'"
          :src="mediaPreviewUrl"
          controls
          autoplay
        />
        <a v-else :href="mediaPreviewUrl" target="_blank">
          {{ mediaPreviewFile?.originalName || mediaPreviewFile?.fileName || mediaPreviewUrl }}
        </a>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { formatToDateTime } from '@/utils/dateUtil';
import { baseApiUrl } from '@/utils/request';
import { useFormModal } from '@/hooks/useModal';
import { uploadUpload } from '@/api/backend/api/toolsUpload';
import { storageRefreshFileToken, storageRefreshFileTokenById } from '@/api/backend/api/toolsStorage';
import {
  vpetBillingByVisit,
  vpetBillingPay,
  vpetBillingSyncVisit,
  vpetChronicCaseList,
  vpetLabCreate,
  vpetLabList,
  vpetLabTemplateList,
  vpetMemberBalance,
  vpetPrescriptionByVisit,
  vpetPrescriptionCreate,
  vpetPrescriptionDispense,
  vpetPrescriptionStockTxns,
  vpetPrescriptionTemplateList,
  vpetVisitDiagnosisCodes,
  vpetVisitEnd,
  vpetVisitGet,
  vpetVisitAuditLogs,
  vpetVisitCareFollowupCreate,
  vpetVisitCareFollowups,
  vpetVisitLockEmr,
  vpetVisitMediaBatchCreate,
  vpetVisitMediaBatches,
  vpetVisitMediaFileCreate,
  vpetVisitRequestUnlock,
  vpetVisitSignEmr,
  vpetVisitSignatures,
  vpetVisitStart,
  vpetVisitUpdate,
} from '@/api/backend/vpet';
import { vpetPharmacyChargeableSearch } from '@/api/backend/vpet/pharmacy';
import { useVpetLocale } from '../shared/locale';
import { useVpetReference } from '../shared/reference';
import { calculatePrescriptionFormula } from '../prescription/formula';

defineOptions({ name: 'VPetConsultationDetail' });

type DiagnosisOption = {
  value: string;
  label: string;
  name: string;
};

type ChargeableOption = {
  value: string;
  label: string;
  raw: any;
  itemName: string;
  specification?: string;
  retailPrice?: number;
};

type RxDetailForm = {
  rowKey: string;
  itemSelectValue?: string;
  itemKind: number;
  itemId?: number;
  itemName: string;
  drugId?: number;
  chargeItemId?: number;
  drugName: string;
  specification?: string;
  dosage?: string;
  dosageFormula?: string;
  dosageUnit?: string;
  frequency?: string;
  quantity: number;
  quantityFormula?: string;
  unitPrice: number;
};

const {
  t,
  labStatusColor,
  labStatusText,
  paymentMethodOptions,
  paymentMethodText,
  paymentStatusColor,
  paymentStatusText,
  prescriptionStatusColor,
  prescriptionStatusText,
  queueEventText,
  visitStatusColor,
  visitStatusText,
} = useVpetLocale();
const { customerLabel, doctorLabel, drugLabel, filterByLabel, loadDictOptions, petLabel } = useVpetReference();
const route = useRoute();
const router = useRouter();
const [showUnlockModal] = useFormModal();
const visitScopeOptions = computed(() =>
  route.query.scope === 'currentStaff' ? { params: { scope: 'currentStaff' } } : undefined,
);

const currentVisit = ref<any>(null);
const prescriptions = ref<any[]>([]);
const billings = ref<any[]>([]);
const labs = ref<any[]>([]);
const chronicCases = ref<any[]>([]);
const careFollowups = ref<any[]>([]);
const mediaBatches = ref<any[]>([]);
const continuousCareExpanded = ref(false);
const emrAuditLogs = ref<any[]>([]);
const emrSignatures = ref<any[]>([]);
const prescriptionTxnsMap = ref<Record<number, any[]>>({});
const memberBalance = ref<any>(null);
const diagnosisOptions = ref<DiagnosisOption[]>([]);
const chargeableOptions = ref<ChargeableOption[]>([]);
const sampleTypeOptions = ref<any[]>([]);
const labTemplates = ref<any[]>([]);
const prescriptionTemplates = ref<any[]>([]);
const selectedPrescriptionTemplateId = ref<number[]>([]);
const payVisible = ref(false);
const labCreateVisible = ref(false);
const mediaBatchVisible = ref(false);
const mediaPreviewVisible = ref(false);
const paying = ref(false);
const payingBill = ref<any>(null);
const uploadingMediaBatchId = ref<number | undefined>();
const downloadingMediaFileId = ref<number | undefined>();
const mediaDisplayUrls = ref<Record<string, string>>({});
const mediaPreviewFile = ref<any>(null);
const mediaPreviewUrl = ref('');

const soap = ref({
  S: '',
  O: '',
  diagnosisCode: undefined as string | undefined,
  diagnosisName: '',
  P: '',
});

const careFollowupForm = ref({
  symptomSummary: '',
  statusSummary: '',
  temperature: undefined as number | undefined,
  heartRate: undefined as number | undefined,
  respiratoryRate: undefined as number | undefined,
  weight: undefined as number | undefined,
  objectiveNote: '',
  assessmentText: '',
  planAdjustment: '',
  medicationAdjustment: '',
  labOrderIds: [] as number[],
  prescriptionIds: [] as number[],
});

const rxForm = ref({
  visitId: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  diagnosisSummary: '',
  details: [] as RxDetailForm[],
});

const payForm = ref({
  paymentMethod: undefined as number | undefined,
  paidAmount: 0,
});

const labCreateForm = ref({
  templateId: undefined as number | undefined,
  testName: '',
  sampleType: undefined as string | undefined,
  chargeAmount: 0,
});

const mediaBatchForm = ref({
  capturedAt: '',
  relationType: 'soap' as 'soap' | 'care_followup',
  careFollowupId: undefined as number | undefined,
  remark: '',
});

const labTemplateOptions = computed(() => {
  const species = currentVisit.value?.pet?.species || currentVisit.value?.petSnapshot?.species;
  return labTemplates.value
    .filter((item: any) => !item.speciesScope || item.speciesScope === 'all' || item.speciesScope === species)
    .map((item: any) => ({
      value: item.id,
      label: `${item.name}${item.sampleType ? ` / ${item.sampleType}` : ''}`,
    }));
});

const prescriptionTemplateOptions = computed(() => {
  const species = currentVisit.value?.pet?.species || currentVisit.value?.petSnapshot?.species;
  return prescriptionTemplates.value
    .filter((item: any) => !item.speciesScope || item.speciesScope === 'all' || item.speciesScope === species)
    .map((item: any) => ({
      value: item.id,
      label: `${item.templateName} / ${item.templateCode}`,
    }));
});

const careLabOptions = computed(() => labs.value.map((item: any) => ({
  value: Number(item.id),
  label: `${item.orderNo} / ${item.testName || '-'} / ${labStatusText(item.status)}`,
})));

const carePrescriptionOptions = computed(() => prescriptions.value.map((item: any) => ({
  value: Number(item.id),
  label: `${item.rxNo}${item.batchNo ? ` / ${item.batchNo}` : ''} / ${prescriptionStatusText(item.status)}`,
})));

const mediaRelationOptions = computed(() => [
  { value: 'soap', label: t('page.consultation.detail.relationSoap') },
  { value: 'care_followup', label: t('page.consultation.detail.relationCareFollowup') },
]);

const mediaCareFollowupOptions = computed(() => careFollowups.value.map((item: any) => ({
  value: Number(item.id),
  label: `${item.batchNo} / ${formatToDateTime(item.occurredAt)} / ${item.symptomSummary || item.statusSummary || '-'}`,
})));

const defaultPaymentMethod = computed<number | undefined>(() => {
  const cashOption = paymentMethodOptions.value.find(item => Number(item.value) === 3);
  const candidate = cashOption?.value ?? paymentMethodOptions.value[0]?.value;
  return candidate === undefined ? undefined : Number(candidate);
});

let diagnosisSearchTimer: number | undefined;
let chargeableSearchTimer: number | undefined;
let rxDetailRowSeed = 0;

function createRxDetailRowKey() {
  rxDetailRowSeed += 1;
  return `visit-rx-detail-${Date.now()}-${rxDetailRowSeed}`;
}

function createEmptyRxDetail(): RxDetailForm {
  return {
    rowKey: createRxDetailRowKey(),
    itemSelectValue: undefined,
    itemKind: 1,
    itemId: undefined,
    itemName: '',
    drugId: undefined,
    chargeItemId: undefined,
    drugName: '',
    specification: '',
    dosage: '',
    dosageFormula: '',
    dosageUnit: '',
    frequency: 'bid',
    quantity: 1,
    quantityFormula: '',
    unitPrice: 0,
  };
}

function parseDiagnosisList(detail: any) {
  if (Array.isArray(detail?.diagnoses)) {
    return detail.diagnoses;
  }
  if (Array.isArray(detail?.diagnosis)) {
    return detail.diagnosis;
  }
  if (typeof detail?.diagnosis === 'string') {
    try {
      const parsed = JSON.parse(detail.diagnosis);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const pageTitle = computed(() => {
  const petName = currentVisit.value?.pet?.name || currentVisit.value?.petSnapshot?.name;
  const customerName = customerLabel(
    currentVisit.value?.customer,
    currentVisit.value?.customerSnapshot,
    currentVisit.value?.customerId,
  );
  return petName ? `${petName} / ${customerName}` : t('page.consultation.detail.titleFallback');
});

const doctorDisplay = computed(() => {
  return doctorLabel(currentVisit.value?.doctor, currentVisit.value?.doctorId, currentVisit.value?.doctorName);
});

const petSummary = computed(() => {
  return petLabel(currentVisit.value?.pet, currentVisit.value?.petSnapshot, currentVisit.value?.petId);
});

const diagnosisSummary = computed(() => {
  return parseDiagnosisList(currentVisit.value)
    .map((item: any) => item.name || item.code)
    .filter(Boolean)
    .join(' / ');
});

const diagnosisTraceItems = computed(() => parseDiagnosisList(currentVisit.value));

const isVisitLocked = computed(() => Number(currentVisit.value?.locked || 0) === 1);
const canEditVisit = computed(() => [1, 2, 3].includes(Number(currentVisit.value?.status || 0)) && !isVisitLocked.value);
const canEndVisit = computed(() => [1, 2, 3].includes(Number(currentVisit.value?.status || 0)));
const dispensedPrescriptionCount = computed(() => prescriptions.value.filter(item => Number(item.status) === 4).length);
const billingReceivableTotal = computed(() => billings.value.reduce((sum, bill) => sum + billReceivable(bill), 0));
const billingDueTotal = computed(() => billings.value.reduce((sum, bill) => sum + billDue(bill), 0));
const memberBalanceText = computed(() => {
  return memberBalance.value
    ? `${Number(memberBalance.value.balance || 0).toFixed(2)} ${t('common.amountUnit')}`
    : t('page.billing.memberNotOpened');
});

const rxDetailInputColumns = [
  { title: t('page.prescription.fields.item'), key: 'item', width: 380 },
  { title: t('page.prescription.fields.specification'), key: 'specification', width: 180 },
  { title: t('page.prescription.fields.dosage'), key: 'dosage', width: 220 },
  { title: t('page.prescription.fields.frequency'), key: 'frequency', width: 180 },
  { title: t('page.prescription.fields.quantity'), key: 'quantity', width: 130 },
  { title: t('page.prescription.fields.dosageUnit'), key: 'dosageUnit', width: 120 },
  { title: t('page.prescription.fields.unitPrice'), key: 'unitPrice', width: 130 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' as const },
];

function billReceivable(bill: any) {
  return Math.max(Number(bill.totalAmount || 0) - Number(bill.discount || 0), 0);
}

function billDue(bill: any) {
  return Math.max(billReceivable(bill) - Number(bill.paidAmount || 0), 0);
}

function parseDiagnosis(detail: any) {
  const first = parseDiagnosisList(detail)[0];
  return {
    code: first?.code,
    name: first?.name || '',
  };
}

function staffLabel(staff?: any, staffId?: string | number | null, fallbackName?: string) {
  return doctorLabel(staff, staffId, fallbackName);
}

function ensureArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

async function loadVisit(startIfNeeded = false) {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  const snapshot: any = await vpetVisitGet(visitId, visitScopeOptions.value);
  const shouldStart = startIfNeeded
    && [1, 2].includes(Number(snapshot?.status || 0))
    && !snapshot?.startTime;
  const detail = shouldStart
    ? await vpetVisitStart(visitId, visitScopeOptions.value)
    : snapshot;

  currentVisit.value = detail;
  await loadEmrCompliance();
  soap.value.S = detail?.chiefComplaint || '';
  soap.value.P = detail?.treatmentPlan || '';
  soap.value.O = detail?.physicalExam?.note || detail?.physicalExam?.summary || '';

  const diagnosis = parseDiagnosis(detail);
  soap.value.diagnosisCode = diagnosis.code;
  soap.value.diagnosisName = diagnosis.name;

  rxForm.value.visitId = detail?.id;
  rxForm.value.doctorId = detail?.doctorId;
  rxForm.value.diagnosisSummary = diagnosis.name || diagnosis.code || '';
  if (rxForm.value.details.length === 0) {
    rxForm.value.details = [createEmptyRxDetail()];
  }
}

async function loadEmrCompliance() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  const [logs, signatures] = await Promise.all([
    vpetVisitAuditLogs(visitId, visitScopeOptions.value),
    vpetVisitSignatures(visitId, visitScopeOptions.value),
  ]);
  emrAuditLogs.value = (logs || []) as any[];
  emrSignatures.value = (signatures || []) as any[];
}

function emrAuditActionText(action: string) {
  const mapping: Record<string, string> = {
    lock: t('page.consultation.detail.auditLock'),
    signed: t('page.consultation.detail.auditSigned'),
    unlock_requested: t('page.consultation.detail.auditUnlockRequested'),
    unlock_approved: t('page.consultation.detail.auditUnlockApproved'),
    unlock_rejected: t('page.consultation.detail.auditUnlockRejected'),
  };
  return mapping[action] || action;
}

async function loadPrescriptions() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  prescriptions.value = ensureArray(await vpetPrescriptionByVisit(visitId));

  const txns = await Promise.all(
    prescriptions.value.map(async (item) => {
      const list = await vpetPrescriptionStockTxns(item.id);
      return [item.id, list || []] as const;
    }),
  );
  prescriptionTxnsMap.value = Object.fromEntries(txns);
}

async function loadBillings() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  billings.value = ensureArray(await vpetBillingByVisit(visitId));
}

async function loadLabs() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  const result = await vpetLabList({ visitId, page: 1, pageSize: 100 });
  labs.value = ensureArray(result?.items);
}

async function loadChronicCases() {
  const petId = Number(currentVisit.value?.petId || 0);
  if (!petId) {
    chronicCases.value = [];
    return;
  }
  chronicCases.value = ensureArray(await vpetChronicCaseList({ petId }));
}

async function loadCareFollowups() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  careFollowups.value = ensureArray(await vpetVisitCareFollowups(visitId, visitScopeOptions.value));
  continuousCareExpanded.value = careFollowups.value.length > 0;
}

async function loadMediaBatches() {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  mediaBatches.value = ensureArray(await vpetVisitMediaBatches(visitId, visitScopeOptions.value));
}

async function loadMemberBalance() {
  const customerId = Number(currentVisit.value?.customerId || 0);
  if (!customerId) {
    memberBalance.value = null;
    return;
  }
  try {
    memberBalance.value = await vpetMemberBalance(customerId);
  } catch {
    memberBalance.value = null;
  }
}

async function refreshLinkedData() {
  await Promise.all([loadPrescriptions(), loadBillings(), loadLabs(), loadMemberBalance(), loadChronicCases(), loadCareFollowups(), loadMediaBatches()]);
}

async function searchDiagnosisOptions(keyword = '') {
  try {
    const items = await vpetVisitDiagnosisCodes({
      keyword,
      species: currentVisit.value?.pet?.species,
    }) as any[];
    diagnosisOptions.value = (items || []).map(item => ({
      value: item.code,
      label: `${item.code} / ${item.name}`,
      name: item.name,
    }));
  } catch {
    diagnosisOptions.value = [];
  }
}

async function searchChargeableOptions(keyword = '') {
  try {
    const items = await vpetPharmacyChargeableSearch(keyword) as any[];
    setChargeableOptions((items || []).map(item => ({
      value: `${item.itemKind}:${item.itemId}`,
      label: chargeableLabelFromOption(item),
      raw: item,
      itemName: item.itemName || item.drugName,
      specification: item.specification,
      retailPrice: Number(item.retailPrice || 0),
    })));
  } catch {
    setChargeableOptions([]);
  }
}

function chargeableLabelFromOption(item: any) {
  const source = item.itemKind === 2 ? t('page.serviceItem.title') : t('page.pharmacy.title');
  const name = item.itemName || item.drugName;
  const specification = item.specification ? ` / ${item.specification}` : '';
  const unit = item.dosageUnit || item.unit || '';
  const stock = item.currentStock !== undefined && item.currentStock !== null
    ? ` / ${t('page.pharmacy.fields.currentStock')} ${Number(item.currentStock || 0).toFixed(2)}${unit}`
    : '';
  const price = ` / ${Number(item.retailPrice || 0).toFixed(2)}${t('common.amountUnit')}${unit ? `/${unit}` : ''}`;
  return `${source} / ${name}${specification}${price}${stock}`;
}

function chargeableValueFromRxDetail(detail: Partial<RxDetailForm> | any) {
  const itemKind = Number(detail.itemKind || (detail.chargeItemId ? 2 : 1));
  const itemId = detail.itemId || detail.drugId || detail.chargeItemId;
  return itemId ? `${itemKind}:${itemId}` : undefined;
}

function chargeableLabelFromRxDetail(detail: Partial<RxDetailForm> | any) {
  const itemKind = Number(detail.itemKind || (detail.chargeItemId ? 2 : 1));
  const name = detail.itemName || detail.drugName || t('page.consultation.detail.drugFallback');
  const specification = detail.specification ? ` / ${detail.specification}` : '';
  const unit = detail.dosageUnit ? ` / ${detail.dosageUnit}` : '';
  return `${itemKind === 2 ? t('page.serviceItem.title') : t('page.pharmacy.title')} / ${name}${specification}${unit}`;
}

function chargeableOptionFromRxDetail(detail: RxDetailForm): ChargeableOption | undefined {
  const value = detail.itemSelectValue || chargeableValueFromRxDetail(detail);
  if (!value) return undefined;
  return {
    value,
    label: chargeableLabelFromRxDetail(detail),
    raw: {
      ...detail,
      itemKind: detail.itemKind,
      itemId: detail.itemId,
      itemName: detail.itemName || detail.drugName,
      drugName: detail.drugName || detail.itemName,
      retailPrice: detail.unitPrice,
      dosageUnit: detail.dosageUnit,
    },
    itemName: detail.itemName || detail.drugName,
    specification: detail.specification,
    retailPrice: detail.unitPrice,
  };
}

function setChargeableOptions(baseOptions: ChargeableOption[]) {
  const optionMap = new Map<string, ChargeableOption>();
  [...baseOptions, ...rxForm.value.details.map(chargeableOptionFromRxDetail)]
    .filter(Boolean)
    .forEach((item: any) => {
      optionMap.set(String(item.value), item);
    });
  chargeableOptions.value = Array.from(optionMap.values());
}

async function loadPrescriptionTemplates() {
  try {
    const result = await vpetPrescriptionTemplateList({ page: 1, pageSize: 100, status: 1 });
    prescriptionTemplates.value = result?.items || [];
  } catch {
    prescriptionTemplates.value = [];
  }
}

function handleDiagnosisSearch(keyword: string) {
  window.clearTimeout(diagnosisSearchTimer);
  diagnosisSearchTimer = window.setTimeout(() => {
    searchDiagnosisOptions(keyword);
  }, 250);
}

function handleChargeableSearch(keyword: string) {
  window.clearTimeout(chargeableSearchTimer);
  chargeableSearchTimer = window.setTimeout(() => {
    searchChargeableOptions(keyword);
  }, 250);
}

function handleDiagnosisChange(value: any) {
  const nextValue = value ? String(value) : undefined;
  const option = diagnosisOptions.value.find(item => item.value === nextValue);
  soap.value.diagnosisCode = nextValue;
  soap.value.diagnosisName = option?.name || '';
  if (!rxForm.value.diagnosisSummary) {
    rxForm.value.diagnosisSummary = option?.name || nextValue || '';
  }
}

function handleChargeableChange(index: number, value: any) {
  const option = chargeableOptions.value.find(item => String(item.value) === String(value))?.raw;
  const detail = rxForm.value.details[index];
  if (!detail || !option) return;
  fillRxDetailFromItem(detail, option);
}

function fillRxDetailFromItem(detail: RxDetailForm, option: any) {
  const itemKind = Number(option.itemKind || 1);
  detail.itemSelectValue = `${itemKind}:${option.itemId || option.id}`;
  detail.itemKind = itemKind;
  detail.itemId = option.itemId || option.id;
  detail.itemName = option.itemName || option.drugName;
  detail.drugId = itemKind === 1 ? (option.drugId || option.id) : undefined;
  detail.chargeItemId = itemKind === 2 ? (option.chargeItemId || option.id) : undefined;
  detail.drugName = option.itemName || option.drugName;
  detail.specification = option.specification || '';
  detail.dosageUnit = option.dosageUnit || option.unit || '';
  detail.unitPrice = Number(option.retailPrice || 0);
}

function createRxDetailFromTemplateItem(item: any): RxDetailForm {
  const itemSelectValue = `${Number(item.itemKind || 1)}:${item.itemId || item.drugId || item.chargeItemId}`;
  return {
    rowKey: createRxDetailRowKey(),
    itemSelectValue,
    itemKind: Number(item.itemKind || 1),
    itemId: item.itemId || item.drugId || item.chargeItemId,
    itemName: item.itemName || item.drugName,
    drugId: item.drugId,
    chargeItemId: item.chargeItemId,
    drugName: item.itemName || item.drugName,
    specification: item.specification || '',
    dosage: calculateDosageFromTemplate(item),
    dosageFormula: item.dosageFormula || '',
    dosageUnit: item.dosageUnit || item.unit || '',
    frequency: item.frequency || '',
    quantity: calculateQuantityFromTemplate(item),
    quantityFormula: item.quantityFormula || '',
    unitPrice: Number(item.unitPrice || 0),
  };
}

function currentPetWeight() {
  return Number(currentVisit.value?.pet?.weight || currentVisit.value?.petSnapshot?.weight || 0) || undefined;
}

function calculateDosageFromTemplate(item: any) {
  const calculated = calculatePrescriptionFormula(item.dosageFormula, { weight: currentPetWeight() });
  return calculated === undefined ? (item.dosage || '') : String(calculated);
}

function calculateQuantityFromTemplate(item: any) {
  const calculated = calculatePrescriptionFormula(item.quantityFormula, { weight: currentPetWeight() });
  return calculated === undefined ? Number(item.quantity || 1) : calculated;
}

function normalizePrescriptionTemplateIds(templateIds?: number[] | number) {
  if (Array.isArray(templateIds)) return templateIds.map(Number).filter(Boolean);
  return templateIds ? [Number(templateIds)] : [];
}

function applyPrescriptionTemplate(templateIds?: number[] | number) {
  const ids = normalizePrescriptionTemplateIds(templateIds);
  if (!ids.length) {
    rxForm.value.details = [createEmptyRxDetail()];
    setChargeableOptions(chargeableOptions.value);
    return;
  }
  const selectedTemplates = prescriptionTemplates.value.filter((item: any) => ids.includes(Number(item.id)));
  const details = selectedTemplates.flatMap((template: any) => (template.items || []).map(createRxDetailFromTemplateItem));
  rxForm.value.details = details.length ? details : [createEmptyRxDetail()];
  setChargeableOptions(chargeableOptions.value);
}

function addRxDetail() {
  rxForm.value.details.push(createEmptyRxDetail());
}

function removeRxDetail(index: number) {
  rxForm.value.details.splice(index, 1);
}

function resetCareFollowupForm() {
  careFollowupForm.value = {
    symptomSummary: '',
    statusSummary: '',
    temperature: undefined,
    heartRate: undefined,
    respiratoryRate: undefined,
    weight: undefined,
    objectiveNote: '',
    assessmentText: '',
    planAdjustment: '',
    medicationAdjustment: '',
    labOrderIds: [],
    prescriptionIds: [],
  };
}

function collectVitalSigns() {
  return Object.fromEntries(
    Object.entries({
      temperature: careFollowupForm.value.temperature,
      heartRate: careFollowupForm.value.heartRate,
      respiratoryRate: careFollowupForm.value.respiratoryRate,
      weight: careFollowupForm.value.weight,
    }).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function vitalSignText(vitalSigns?: Record<string, any> | null) {
  if (!vitalSigns) return '';
  return [
    vitalSigns.temperature !== undefined ? `${t('page.consultation.detail.temperature')} ${vitalSigns.temperature}℃` : '',
    vitalSigns.heartRate !== undefined ? `${t('page.consultation.detail.heartRate')} ${vitalSigns.heartRate}/min` : '',
    vitalSigns.respiratoryRate !== undefined ? `${t('page.consultation.detail.respiratoryRate')} ${vitalSigns.respiratoryRate}/min` : '',
    vitalSigns.weight !== undefined ? `${t('page.consultation.detail.weight')} ${vitalSigns.weight}kg` : '',
  ].filter(Boolean).join(' / ');
}

function labResultSummary(lab: any) {
  const summary = lab.reportSummary || '';
  const abnormal = Number(lab.abnormalCount || 0) > 0
    ? `${t('page.lab.fields.abnormalCount')} ${lab.abnormalCount}`
    : '';
  const items = (lab.resultItems || [])
    .slice(0, 4)
    .map((item: any) => `${item.itemName}: ${[item.resultValue, item.unit, item.flag].filter(Boolean).join(' ')}`)
    .join('；');
  return [summary, abnormal, items].filter(Boolean).join(' / ') || '-';
}

function prescriptionBrief(rx: any) {
  return (rx.details || [])
    .slice(0, 4)
    .map((item: any) => `${item.itemName || item.drugName} ${[item.dosage, item.frequency, `x${item.quantity || 0}${item.dosageUnit || ''}`].filter(Boolean).join(' / ')}`)
    .join('；') || '-';
}

function currentLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function openMediaBatchModal() {
  mediaBatchForm.value = {
    capturedAt: currentLocalDateTime(),
    relationType: 'soap',
    careFollowupId: undefined,
    remark: '',
  };
  mediaBatchVisible.value = true;
}

function mediaRelationText(batch: any) {
  if (batch?.relationType === 'care_followup') {
    const followup = batch.careFollowup || careFollowups.value.find(item => Number(item.id) === Number(batch.careFollowupId));
    return `${t('page.consultation.detail.relationCareFollowup')}${followup?.batchNo ? ` / ${followup.batchNo}` : ''}`;
  }
  return t('page.consultation.detail.relationSoap');
}

function inferMediaFileType(file: any): 'image' | 'video' {
  const mimeType = String(file?.type || file?.mimeType || '').toLowerCase();
  const name = String(file?.name || file?.originalName || file?.url || '').toLowerCase();
  if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v)$/.test(name)) return 'video';
  return 'image';
}

function normalizeMediaStoragePath(url?: string) {
  if (!url) return '';
  return url;
}

function mediaFileUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseApiUrl || ''}${normalizeMediaStoragePath(url)}`;
}

function mediaDisplayUrl(url?: string) {
  if (!url) return '';
  return mediaDisplayUrls.value[url] || mediaFileUrl(url);
}

function extractStorageToken(url?: string) {
  const match = String(url || '').match(/\/api\/(?:tools\/)?storage\/file\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

async function refreshMediaDisplayUrl(url?: string, force = false) {
  const token = extractStorageToken(url);
  if (!token || !url || (!force && mediaDisplayUrls.value[url])) return;
  try {
    const result = await storageRefreshFileToken(token, { errorMsg: false });
    if (result?.path) {
      mediaDisplayUrls.value = {
        ...mediaDisplayUrls.value,
        [url]: mediaFileUrl(result.path),
      };
    }
  } catch {
    // Keep the original media URL visible; authorization errors are handled by the preview request itself.
  }
}

async function refreshMediaFileDisplayUrl(file: any, force = false) {
  return refreshMediaFileUrl(file, 'url', 'storageId', force);
}

async function refreshMediaFileThumbnailDisplayUrl(file: any, force = false) {
  return refreshMediaFileUrl(file, 'thumbnailUrl', 'thumbnailStorageId', force);
}

async function refreshMediaFileUrl(file: any, urlField: string, storageIdField: string, force = false) {
  const url = file?.[urlField];
  if (!url || file?.storageType !== 'local') return;
  if (!force && mediaDisplayUrls.value[url]) return;

  try {
    const token = extractStorageToken(url);
    const storageId = file?.[storageIdField];
    if (!storageId && !token) return;
    const result = storageId
      ? await storageRefreshFileTokenById(Number(storageId), { errorMsg: false })
      : await storageRefreshFileToken(token, { errorMsg: false });
    if (result?.path) {
      mediaDisplayUrls.value = {
        ...mediaDisplayUrls.value,
        [url]: mediaFileUrl(result.path),
      };
    }
  } catch {
    // Keep the original media URL visible; authorization errors are handled by the preview request itself.
  }
}

function mediaThumbnailDisplayUrl(file: any) {
  const thumbnailUrl = file?.thumbnailUrl;
  if (!thumbnailUrl) return mediaDisplayUrl(file?.url);
  return mediaDisplayUrl(thumbnailUrl);
}

async function resolveMediaDisplayUrl(file: any) {
  const url = file?.url;
  if (!url) return '';
  if (file?.storageType === 'local') {
    await refreshMediaFileDisplayUrl(file);
  }
  return mediaDisplayUrl(url);
}

async function openMediaPreview(file: any) {
  const previewUrl = await resolveMediaDisplayUrl(file);
  if (!previewUrl) {
    message.error(t('page.consultation.messages.mediaPreviewUnavailable'));
    return;
  }
  mediaPreviewFile.value = file;
  mediaPreviewUrl.value = previewUrl;
  mediaPreviewVisible.value = true;
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'media-file';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadMediaFile(file: any) {
  const rawUrl = file?.url;
  if (!rawUrl) return;
  downloadingMediaFileId.value = Number(file.id);
  try {
    const url = await resolveMediaDisplayUrl(file);
    const filename = file.originalName || file.fileName || rawUrl.split('/').pop() || 'media-file';
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl, filename);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      triggerDownload(url, filename);
    }
  } catch {
    message.error(t('page.consultation.messages.mediaDownloadFailed'));
  } finally {
    downloadingMediaFileId.value = undefined;
  }
}

function fileSizeText(size?: number | string | null) {
  const value = Number(size || 0);
  if (!value) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

async function submitMediaBatch() {
  if (!currentVisit.value?.id || !canEditVisit.value) return;
  if (mediaBatchForm.value.relationType === 'care_followup' && !mediaBatchForm.value.careFollowupId) {
    message.error(t('page.consultation.messages.mediaCareFollowupRequired'));
    return;
  }

  await vpetVisitMediaBatchCreate(
    currentVisit.value.id,
    {
      capturedAt: mediaBatchForm.value.capturedAt
        ? new Date(mediaBatchForm.value.capturedAt).toISOString()
        : undefined,
      relationType: mediaBatchForm.value.relationType,
      careFollowupId: mediaBatchForm.value.relationType === 'care_followup'
        ? mediaBatchForm.value.careFollowupId
        : undefined,
      remark: mediaBatchForm.value.remark || undefined,
    },
    visitScopeOptions.value,
  );
  mediaBatchVisible.value = false;
  message.success(t('page.consultation.messages.mediaBatchCreated'));
  await loadMediaBatches();
}

async function uploadMediaFile(batch: any, file: File) {
  if (!currentVisit.value?.id || !batch?.id || !canEditVisit.value) return false;
  uploadingMediaBatchId.value = Number(batch.id);
  try {
    const result = await uploadUpload({}, file);
    const uploadedUrl = result?.path || result?.filename;
    const thumbnailUrl = result?.thumbnail?.path;
    if (!uploadedUrl) {
      message.error(t('page.consultation.messages.mediaUploadMissingUrl'));
      return false;
    }
    mediaBatches.value = ensureArray(await vpetVisitMediaFileCreate(
      currentVisit.value.id,
      Number(batch.id),
      {
        fileType: inferMediaFileType(file),
        storageType: 'local',
        storageId: result.id,
        thumbnailStorageId: result.thumbnail?.id,
        fileName: uploadedUrl?.split('/').pop(),
        originalName: file.name,
        url: uploadedUrl,
        thumbnailUrl,
        mimeType: file.type || undefined,
        fileSize: file.size,
      },
      visitScopeOptions.value,
    ));
    message.success(t('page.consultation.messages.mediaFileUploaded'));
  } finally {
    uploadingMediaBatchId.value = undefined;
  }
  return false;
}

async function submitCareFollowup() {
  if (!currentVisit.value?.id || !canEditVisit.value) return;
  const vitalSigns = collectVitalSigns();
  const hasContent = [
    careFollowupForm.value.symptomSummary,
    careFollowupForm.value.statusSummary,
    careFollowupForm.value.objectiveNote,
    careFollowupForm.value.assessmentText,
    careFollowupForm.value.planAdjustment,
    careFollowupForm.value.medicationAdjustment,
    Object.keys(vitalSigns).length ? 'vitals' : '',
    careFollowupForm.value.labOrderIds.length ? 'labs' : '',
    careFollowupForm.value.prescriptionIds.length ? 'prescriptions' : '',
  ].some(Boolean);

  if (!hasContent) {
    message.error(t('page.consultation.messages.careFollowupRequired'));
    return;
  }

  careFollowups.value = ensureArray(await vpetVisitCareFollowupCreate(
    currentVisit.value.id,
    {
      careStage: currentVisit.value?.careStage,
      symptomSummary: careFollowupForm.value.symptomSummary || undefined,
      statusSummary: careFollowupForm.value.statusSummary || undefined,
      vitalSigns: Object.keys(vitalSigns).length ? JSON.stringify(vitalSigns) : undefined,
      objectiveNote: careFollowupForm.value.objectiveNote || undefined,
      assessmentText: careFollowupForm.value.assessmentText || undefined,
      planAdjustment: careFollowupForm.value.planAdjustment || undefined,
      medicationAdjustment: careFollowupForm.value.medicationAdjustment || undefined,
      labOrderIds: careFollowupForm.value.labOrderIds,
      prescriptionIds: careFollowupForm.value.prescriptionIds,
    },
    visitScopeOptions.value,
  ));
  continuousCareExpanded.value = true;
  resetCareFollowupForm();
  message.success(t('page.consultation.messages.careFollowupCreated'));
}

async function saveSoap() {
  if (!currentVisit.value?.id || !canEditVisit.value) return;
  const diagnosisPayload = soap.value.diagnosisCode
    ? [{
        code: soap.value.diagnosisCode,
        name: soap.value.diagnosisName || soap.value.diagnosisCode,
        type: 'confirmed',
      }]
    : undefined;

  await vpetVisitUpdate(
    currentVisit.value.id,
    {
      chiefComplaint: soap.value.S,
      treatmentPlan: soap.value.P,
      symptomSummary: soap.value.S,
      physicalExam: soap.value.O ? JSON.stringify({ note: soap.value.O }) : undefined,
      diagnosis: diagnosisPayload ? JSON.stringify(diagnosisPayload) : undefined,
    },
    visitScopeOptions.value,
  );
  message.success(t('page.consultation.messages.saved'));
  await loadVisit();
}

async function lockEmr() {
  if (!currentVisit.value?.id || isVisitLocked.value) return;
  if (canEditVisit.value) {
    await saveSoap();
  }
  await vpetVisitLockEmr(
    currentVisit.value.id,
    {
      reason: 'manual_lock',
    },
    visitScopeOptions.value,
  );
  message.success(t('page.consultation.messages.emrLocked'));
  await loadVisit();
}

async function signEmr() {
  if (!currentVisit.value?.id || isVisitLocked.value) return;
  if (canEditVisit.value) {
    await saveSoap();
  }
  await vpetVisitSignEmr(
    currentVisit.value.id,
    {
      signType: 'doctor',
    },
    visitScopeOptions.value,
  );
  message.success(t('page.consultation.messages.emrSigned'));
  await loadVisit();
}

async function requestUnlockEmr() {
  if (!currentVisit.value?.id) return;
  await showUnlockModal({
    modalProps: {
      title: t('page.consultation.detail.unlockReasonPrompt'),
      width: 560,
      onFinish: async (values: any) => {
        await vpetVisitRequestUnlock(
          currentVisit.value.id,
          {
            reason: values.reason,
          },
          visitScopeOptions.value,
        );
        message.success(t('page.consultation.messages.unlockRequested'));
        await loadEmrCompliance();
      },
    },
    formProps: {
      labelWidth: 100,
      schemas: [
        {
          field: 'reason',
          label: t('page.consultation.detail.unlockReason'),
          component: 'InputTextArea',
          required: true,
          colProps: { span: 24 },
        },
      ],
    },
  });
}

async function endVisit() {
  if (!currentVisit.value?.id) return;
  await saveSoap();
  await vpetVisitEnd(currentVisit.value.id, visitScopeOptions.value);
  message.success(t('page.consultation.messages.ended'));
  await loadVisit();
}

async function submitRx() {
  if (!rxForm.value.visitId || !rxForm.value.doctorId) {
    message.error(t('page.prescription.messages.doctorRequired'));
    return;
  }

  const details = rxForm.value.details
    .filter(item => item.itemId || item.drugId || item.chargeItemId)
    .map(item => ({
      itemKind: item.itemKind,
      itemId: item.itemId,
      itemName: item.itemName,
      drugId: item.drugId,
      chargeItemId: item.chargeItemId,
      drugName: item.drugName,
      specification: item.specification,
      dosage: item.dosage,
      dosageUnit: item.dosageUnit,
      frequency: item.frequency,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }));

  if (!details.length) {
    message.error(t('page.prescription.messages.selectDrug'));
    return;
  }

  await vpetPrescriptionCreate({
    visitId: rxForm.value.visitId,
    doctorId: rxForm.value.doctorId,
    diagnosisSummary: rxForm.value.diagnosisSummary || soap.value.diagnosisName || soap.value.diagnosisCode || '',
    details,
  });

  message.success(t('page.prescription.messages.created'));
  rxForm.value.details = [createEmptyRxDetail()];
  selectedPrescriptionTemplateId.value = [];
  await syncBilling(false);
  await loadPrescriptions();
}

async function dispensePrescription(item: any) {
  await vpetPrescriptionDispense(item.id, {});
  message.success(t('page.consultation.messages.dispensed'));
  await loadPrescriptions();
}

async function syncBilling(showMessage = true) {
  const visitId = Number(route.params.id);
  if (!visitId) return;
  await vpetBillingSyncVisit(visitId);
  await loadBillings();
  if (showMessage) {
    message.success(t('page.consultation.messages.billingSynced'));
  }
}

function openLabReport(id: number) {
  router.push(`/vpet/lab/report/${id}`);
}

function openPrintRecord() {
  if (!currentVisit.value?.id) return;
  router.push(`/vpet/consultation/visit/${currentVisit.value.id}/print`);
}

function openChronicCenter() {
  router.push({
    path: '/vpet/chronic',
    query: {
      visitId: currentVisit.value?.id,
      customerId: currentVisit.value?.customerId,
      petId: currentVisit.value?.petId,
    },
  });
}

function openChronicCase(id: number) {
  router.push({
    path: '/vpet/chronic',
    query: {
      caseId: id,
      customerId: currentVisit.value?.customerId,
      petId: currentVisit.value?.petId,
    },
  });
}

function openLabCreateModal() {
  labCreateForm.value = {
    templateId: undefined,
    testName: '',
    sampleType: undefined,
    chargeAmount: 0,
  };
  labCreateVisible.value = true;
}

function handleLabTemplateChange(value: number) {
  const template = labTemplates.value.find((item: any) => Number(item.id) === Number(value));
  if (!template) return;
  labCreateForm.value.templateId = template.id;
  labCreateForm.value.testName = template.name;
  labCreateForm.value.sampleType = template.sampleType || undefined;
  labCreateForm.value.chargeAmount = Number(template.defaultChargeAmount || 0);
}

function openPayModal(bill: any) {
  const due = billDue(bill);
  if (due <= 0) {
    message.info(t('page.billing.messages.cleared'));
    return;
  }
  payingBill.value = bill;
  payForm.value = {
    paymentMethod: defaultPaymentMethod.value,
    paidAmount: due,
  };
  payVisible.value = true;
}

async function submitPayment() {
  if (!payingBill.value) return;
  if (Number(payForm.value.paidAmount || 0) <= 0) {
    message.error(t('page.billing.messages.amountPositive'));
    return;
  }

  paying.value = true;
  try {
    await vpetBillingPay(payingBill.value.id, {
      paymentMethod: payForm.value.paymentMethod,
      paidAmount: Number(payForm.value.paidAmount || 0),
      customerId: currentVisit.value?.customerId,
    });
    message.success(t('page.billing.messages.paid'));
    payVisible.value = false;
    await refreshLinkedData();
  } finally {
    paying.value = false;
  }
}

async function submitLabOrder() {
  if (!currentVisit.value?.id || !labCreateForm.value.testName) {
    message.error(t('page.lab.fields.testName'));
    return;
  }
  await vpetLabCreate({
    visitId: currentVisit.value.id,
    doctorId: currentVisit.value.doctorId,
    templateId: labCreateForm.value.templateId,
    testName: labCreateForm.value.testName,
    sampleType: labCreateForm.value.sampleType,
    chargeAmount: Number(labCreateForm.value.chargeAmount || 0),
  });
  message.success(t('page.lab.messages.created'));
  labCreateVisible.value = false;
  await loadLabs();
}

onMounted(async () => {
  rxForm.value.details = [createEmptyRxDetail()];
  await loadVisit(true);
  sampleTypeOptions.value = await loadDictOptions('vpet_lab_sample_type');
  labTemplates.value = await vpetLabTemplateList() as any[];
  await Promise.all([searchDiagnosisOptions(''), searchChargeableOptions(''), loadPrescriptionTemplates()]);
  await refreshLinkedData();
});
</script>

<style scoped>
.vpet-rx-edit-table :deep(.ant-table-cell) {
  vertical-align: top;
}

.vpet-rx-edit-table :deep(.ant-input),
.vpet-rx-edit-table :deep(.ant-input-number),
.vpet-rx-edit-table :deep(.ant-select) {
  width: 100%;
}

.vpet-media-batches {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.vpet-media-batch {
  padding: 15px;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  background: #fff;
}

.vpet-media-batch__head {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  justify-content: space-between;
}

.vpet-media-files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.vpet-media-file {
  overflow: hidden;
  border: 1px solid #eef2f6;
  border-radius: 10px;
  background: #fafcff;
}

.vpet-media-file__preview {
  display: block;
  width: 100%;
  padding: 0;
  cursor: pointer;
  border: 0;
  background: transparent;
}

.vpet-media-file img,
.vpet-media-file video {
  display: block;
  width: 100%;
  height: 130px;
  object-fit: cover;
  background: #eef2f6;
}

.vpet-media-file__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 130px;
  padding: 12px;
  color: #5f6b7a;
  text-align: center;
  word-break: break-all;
  background: #eef2f6;
}

.vpet-media-file__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  color: #5f6b7a;
  font-size: 12px;
}

.vpet-media-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  background: #f6f8fb;
  border-radius: 12px;
}

.vpet-media-preview img,
.vpet-media-preview video {
  max-width: 100%;
  max-height: 72vh;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .vpet-media-batch__head {
    flex-direction: column;
  }
}

</style>
