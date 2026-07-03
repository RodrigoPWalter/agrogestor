export function DynamicDiaryFields({
  form,
  setForm,
  plantings,
  products,
  machines,
  activityTypes,
  today,
}) {
  const type = form.activityType;
  const needsDescription = ["INSPECTION", "OTHER"].includes(type);
  const needsWeather = type === "INSPECTION";
  const productEvent = ["PRODUCT_PURCHASE", "PRODUCT_USE"].includes(type);

  return (
    <div className="form-grid dynamic-diary-form">
      <label>
        <span>Tipo de acontecimento</span>
        <select
          value={type}
          onChange={(event) =>
            setForm({ ...form, activityType: event.target.value })
          }
        >
          {activityTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Data</span>
        <input
          required
          type="date"
          max={today}
          value={form.entryDate}
          onChange={(event) =>
            setForm({ ...form, entryDate: event.target.value })
          }
        />
      </label>

      <label className="form-grid__full">
        <span>
          Plantio {type === "HARVEST" ? "(obrigatório)" : "(opcional)"}
        </span>
        <select
          required={type === "HARVEST"}
          value={form.plantingId}
          onChange={(event) =>
            setForm({ ...form, plantingId: event.target.value })
          }
        >
          <option value="">Propriedade em geral</option>
          {plantings.map((planting) => (
            <option key={planting.id} value={planting.id}>
              {planting.crop} — {planting.harvest}
            </option>
          ))}
        </select>
      </label>

      {type === "RAIN" && (
        <label className="form-grid__full">
          <span>Quantidade de chuva (mm)</span>
          <input
            required
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={form.rainfallMillimeters}
            onChange={(event) =>
              setForm({ ...form, rainfallMillimeters: event.target.value })
            }
            placeholder="Ex.: 28"
          />
        </label>
      )}

      {productEvent && (
        <>
          <label className="form-grid__full">
            <span>Produto</span>
            <select
              required={type === "PRODUCT_USE" || !form.productName}
              value={form.productId}
              onChange={(event) =>
                setForm({ ...form, productId: event.target.value })
              }
            >
              <option value="">
                {type === "PRODUCT_PURCHASE"
                  ? "Cadastrar um novo produto"
                  : "Selecione no estoque"}
              </option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — saldo {item.quantity} {item.unitName}
                </option>
              ))}
            </select>
          </label>
          {type === "PRODUCT_PURCHASE" && !form.productId && (
            <>
              <label>
                <span>Nome do novo produto</span>
                <input
                  required
                  value={form.productName}
                  onChange={(event) =>
                    setForm({ ...form, productName: event.target.value })
                  }
                  placeholder="Ex.: Glifosato"
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  value={form.productType}
                  onChange={(event) =>
                    setForm({ ...form, productType: event.target.value })
                  }
                >
                  <option value="SEED">Semente</option>
                  <option value="FERTILIZER">Fertilizante</option>
                  <option value="PESTICIDE">Defensivo</option>
                </select>
              </label>
            </>
          )}
          <label>
            <span>
              {type === "PRODUCT_PURCHASE"
                ? "Quantidade comprada"
                : "Quantidade usada"}
            </span>
            <input
              required
              type="number"
              min="0.001"
              step="0.001"
              inputMode="decimal"
              value={form.quantity}
              onChange={(event) =>
                setForm({ ...form, quantity: event.target.value })
              }
            />
          </label>
          {type === "PRODUCT_PURCHASE" && !form.productId && (
            <label>
              <span>Unidade</span>
              <select
                value={form.unit}
                onChange={(event) =>
                  setForm({ ...form, unit: event.target.value })
                }
              >
                <option value="LITER">Litros</option>
                <option value="KILOGRAM">Quilos</option>
                <option value="UNIT">Unidades</option>
              </select>
            </label>
          )}
          {type === "PRODUCT_PURCHASE" && (
            <>
              <label>
                <span>Fornecedor</span>
                <input
                  value={form.supplier}
                  onChange={(event) =>
                    setForm({ ...form, supplier: event.target.value })
                  }
                  placeholder="Ex.: Cotricampo"
                />
              </label>
              <label>
                <span>Valor pago (opcional)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  placeholder="R$ 0,00"
                />
              </label>
            </>
          )}
        </>
      )}

      {type === "MAINTENANCE" && (
        <>
          <label className="form-grid__full">
            <span>Máquina</span>
            <select
              required
              value={form.machineId}
              onChange={(event) =>
                setForm({ ...form, machineId: event.target.value })
              }
            >
              <option value="">Selecione a máquina</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.brand} {machine.model}
                </option>
              ))}
            </select>
          </label>
          <label className="form-grid__full">
            <span>Descrição da manutenção</span>
            <input
              required
              value={form.activity}
              onChange={(event) =>
                setForm({ ...form, activity: event.target.value })
              }
              placeholder="Ex.: Troca de óleo e filtros"
            />
          </label>
          <label>
            <span>Valor (opcional)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) =>
                setForm({ ...form, amount: event.target.value })
              }
            />
          </label>
        </>
      )}

      {type === "HARVEST" && (
        <>
          <label>
            <span>Quantidade colhida</span>
            <input
              required
              type="number"
              min="0.001"
              step="0.001"
              inputMode="decimal"
              value={form.harvestQuantity}
              onChange={(event) =>
                setForm({ ...form, harvestQuantity: event.target.value })
              }
            />
          </label>
          <label>
            <span>Unidade</span>
            <input
              required
              value={form.harvestUnit}
              onChange={(event) =>
                setForm({ ...form, harvestUnit: event.target.value })
              }
            />
          </label>
        </>
      )}

      {needsDescription && (
        <label className="form-grid__full">
          <span>
            {type === "INSPECTION" ? "O que foi vistoriado" : "Descrição"}
          </span>
          <input
            required
            value={form.activity}
            onChange={(event) =>
              setForm({ ...form, activity: event.target.value })
            }
            placeholder="Descreva de forma curta"
          />
        </label>
      )}
      {needsWeather && (
        <label>
          <span>Condição do tempo (opcional)</span>
          <input
            value={form.weatherCondition}
            onChange={(event) =>
              setForm({ ...form, weatherCondition: event.target.value })
            }
            placeholder="Ex.: Nublado"
          />
        </label>
      )}
      <label className="form-grid__full">
        <span>
          Observação{" "}
          {["OBSERVATION", "INSPECTION"].includes(type) ? "" : "(opcional)"}
        </span>
        <textarea
          required={["OBSERVATION", "INSPECTION"].includes(type)}
          rows="3"
          value={form.observations}
          onChange={(event) =>
            setForm({ ...form, observations: event.target.value })
          }
          placeholder="Anotação importante para consultar depois"
        />
      </label>
    </div>
  );
}
