"""Tiny REMS baseline so the ML stack is proven, not just imported."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mars_data import load_weather


def handle_main() -> None:
    weather = load_weather().dropna(subset=["min_temp", "max_temp", "ls", "pressure"])
    features = weather[["ls", "pressure", "min_temp"]]
    target = weather["max_temp"]
    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=0.25, random_state=7
    )

    from lightgbm import LGBMRegressor

    model = LGBMRegressor(n_estimators=80, learning_rate=0.08, verbose=-1)
    model.fit(x_train, y_train)
    pred = model.predict(x_test)
    mae = mean_absolute_error(y_test, pred)
    naive = mean_absolute_error(y_test, np.full_like(y_test, y_train.mean(), dtype=float))
    print(f"LightGBM MAE {mae:.2f} C vs mean baseline {naive:.2f} C")
    print(f"rows {len(weather)}  train {len(x_train)}  test {len(x_test)}")


if __name__ == "__main__":
    handle_main()
