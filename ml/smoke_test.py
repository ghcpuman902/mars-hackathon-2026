"""Prove the local Mars stack actually opens."""

from __future__ import annotations

from mars_data import (
    MOLA_4PPD,
    MOLA_16PPD,
    SWIM_0_1,
    load_mola,
    load_weather,
    mola_sample,
    swim_sample,
)


def handle_main() -> None:
    elev = load_mola(MOLA_16PPD)
    assert elev.shape == (2880, 5760), elev.shape
    olympus = mola_sample(elev, 18.65, 226.2)
    hellas = mola_sample(elev, -42.4, 70.5)
    assert olympus > 15000, olympus
    assert hellas < -5000, hellas

    elev4 = load_mola(MOLA_4PPD)
    assert elev4.shape == (720, 1440), elev4.shape

    ice_arcadia = swim_sample(SWIM_0_1, 40.0, 190.0)
    ice_jezero = swim_sample(SWIM_0_1, 18.38, 77.58)
    assert ice_arcadia == ice_arcadia, "Arcadia ice sample was NaN"
    print(f"Olympus elevation {olympus:.0f} m, Hellas {hellas:.0f} m")
    print(f"SWIM 0-1m consistency: Arcadia {ice_arcadia:.3f}, Jezero {ice_jezero:.3f}")

    weather = load_weather()
    assert len(weather) > 1000, len(weather)
    print(f"Curiosity REMS rows: {len(weather)}")

    import lightgbm  # noqa: F401
    import optuna  # noqa: F401
    import pvlib  # noqa: F401
    import sklearn  # noqa: F401
    import xgboost  # noqa: F401

    print("sklearn / xgboost / lightgbm / optuna / pvlib import ok")
    print("smoke test passed")


if __name__ == "__main__":
    handle_main()
