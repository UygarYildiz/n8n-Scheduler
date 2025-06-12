 main.py - Optimizasyon uç noktası
@app.post("/optimize", response_model=OptimizationResponse)
async def run_optimization(request_data: OptimizationRequest = Body(...)):
    """
    Gelen veriyi ve konfigürasyonu alır, optimizasyonu çalıştırır
    ve sonucu döner.
    """
    start_time = time.time()
    logger.info("Optimizasyon isteği alındı.")

    try:
        # Konfigürasyonu yükle
        config = load_config(request_data.configuration_ref, request_data.configuration)
        input_data = request_data.input_data

        # ShiftSchedulingModelBuilder sınıfını kullanarak modeli oluştur
        model_builder = ShiftSchedulingModelBuilder(
            config=config,
            input_data=input_data.model_dump()  # Pydantic modellerini dict'e çevir
        )

        # Modeli oluştur
        model_builder.build_model()

        # Modeli çöz (thread havuzunda)
        status, result = await run_in_threadpool(model_builder.solve_model)

        # Sonuçları API yanıtına dönüştür
        solution_data = None
        if result.get('solution') and result['solution'].get('assignments'):
            validated_assignments = [Assignment(**a) for a in result['solution']['assignments']]
            solution_data = OptimizationSolution(assignments=validated_assignments)

        return OptimizationResponse(
            status=status,
            solver_status_message=result.get('solver_status_message'),
            processing_time_seconds=time.time() - start_time,
            objective_value=result.get('objective_value'),
            solution=solution_data,
            metrics=result.get('metrics')
        )

    except Exception as e:
        logger.error(f"Optimizasyon sırasında kritik hata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))