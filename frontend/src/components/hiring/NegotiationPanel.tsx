"use client";

import type { HireDetail } from "@/lib/api/hire-requests";
import { useNegotiationForm } from "@/hooks/use-negotiation-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
export function NegotiationPanel({
  detail,
  onRefresh,
  disabled = false,
}: {
  detail: HireDetail;
  onRefresh: () => Promise<HireDetail | undefined>;
  disabled?: boolean;
}) {
  const { draft, edit, busy, submit, refreshDraft } = useNegotiationForm(
    detail,
    onRefresh
  );
  const canPropose = detail.allowedActions.includes("propose");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thương lượng giá và lịch học</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {draft.success && <p role="status">Đã gửi đề xuất.</p>}
        {canPropose && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-3"
          >
            <p className="text-sm text-content-secondary">
              Giá hoặc lịch để nguyên sẽ được kế thừa từ điều khoản hiện tại.
              Chỉ bên nhận được chấp nhận đề xuất mới nhất.
            </p>
            <fieldset disabled={busy || disabled} className="space-y-3">
              <TextField
                label="Giá thương lượng (VND/buổi)"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                placeholder={String(detail.currentTerms.priceVnd)}
                value={draft.price}
                onChange={(e) => edit({ price: e.target.value })}
              />
              <Checkbox
                label="Đề xuất lịch mới"
                checked={draft.editSchedules}
                onChange={(checked) => edit({ editSchedules: checked })}
              />
              {draft.editSchedules && (
                <div className="space-y-3">
                  {draft.schedules.map((slot, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-4">
                      <Dropdown
                        label={`Ngày trong tuần ${index + 1}`}
                        value={String(slot.dayOfWeek)}
                        options={days.map((name, i) => ({
                          value: String(i + 1),
                          label: name,
                        }))}
                        onChange={(value) =>
                          edit({
                            schedules: draft.schedules.map((s, i) =>
                              i === index
                                ? { ...s, dayOfWeek: Number(value) }
                                : s
                            ),
                          })
                        }
                      />
                      <TextField
                        label={`Giờ bắt đầu ${index + 1}`}
                        type="time"
                        required
                        value={slot.startTime}
                        onChange={(e) =>
                          edit({
                            schedules: draft.schedules.map((s, i) =>
                              i === index
                                ? { ...s, startTime: e.target.value }
                                : s
                            ),
                          })
                        }
                      />
                      <TextField
                        label={`Giờ kết thúc ${index + 1}`}
                        type="time"
                        required
                        value={slot.endTime}
                        onChange={(e) =>
                          edit({
                            schedules: draft.schedules.map((s, i) =>
                              i === index
                                ? { ...s, endTime: e.target.value }
                                : s
                            ),
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          edit({
                            schedules: draft.schedules.filter(
                              (_, i) => i !== index
                            ),
                          })
                        }
                      >
                        Xóa khung giờ {index + 1}
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={draft.schedules.length >= 147}
                    onClick={() =>
                      edit({
                        schedules: [
                          ...draft.schedules,
                          {
                            dayOfWeek: 1,
                            startTime: "18:00",
                            endTime: "19:00",
                          },
                        ],
                      })
                    }
                  >
                    Thêm khung giờ
                  </Button>
                  <p className="text-sm text-content-secondary">
                    Giờ Việt Nam. Lịch phải nằm trong lịch rảnh hiện tại của gia
                    sư và đủ thời lượng học.
                  </p>
                </div>
              )}
              <TextArea
                label="Ghi chú đề xuất"
                maxLength={2000}
                value={draft.note}
                onChange={(e) => edit({ note: e.target.value })}
              />
              <Button type="submit" disabled={draft.conflict} isLoading={busy}>
                Gửi đề xuất
              </Button>
            </fieldset>
          </form>
        )}
        {draft.error && (
          <p role="alert" className="text-status-error">
            {draft.error}
          </p>
        )}
        {canPropose && (
          <Button
            variant="secondary"
            disabled={busy || disabled}
            onClick={() => void refreshDraft()}
          >
            Làm mới để kiểm tra đề xuất
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
