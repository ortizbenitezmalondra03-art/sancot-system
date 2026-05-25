-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-05-2026 a las 18:31:51
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sancot`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `apartados`
--

CREATE TABLE `apartados` (
  `id_apart` int(11) NOT NULL,
  `Nom_cliente` varchar(80) NOT NULL,
  `Telefono` varchar(15) DEFAULT NULL,
  `Anticipo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Total_ap` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Restante` decimal(10,2) GENERATED ALWAYS AS (`Total_ap` - `Anticipo`) STORED,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `Estado` varchar(20) NOT NULL DEFAULT 'activo',
  `id_venta` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `apartados`
--

INSERT INTO `apartados` (`id_apart`, `Nom_cliente`, `Telefono`, `Anticipo`, `Total_ap`, `Fecha`, `Estado`, `id_venta`) VALUES
(1, 'Alondra', '4271982903', 100.00, 600.00, '2026-05-22 00:45:04', 'activo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `apartado_items`
--

CREATE TABLE `apartado_items` (
  `id_item` int(11) NOT NULL,
  `id_apart` int(11) NOT NULL,
  `id_prod` int(11) NOT NULL,
  `Talla` varchar(10) NOT NULL,
  `Cantidad` int(11) NOT NULL DEFAULT 1,
  `Precio_unit` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `apartado_items`
--

INSERT INTO `apartado_items` (`id_item`, `id_apart`, `id_prod`, `Talla`, `Cantidad`, `Precio_unit`) VALUES
(1, 1, 8, 'M', 1, 600.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mayoreos`
--

CREATE TABLE `mayoreos` (
  `id_clm` int(11) NOT NULL,
  `n_pedido` varchar(20) DEFAULT NULL,
  `Nombre` varchar(80) NOT NULL,
  `Telefono` varchar(15) DEFAULT NULL,
  `Total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mayoreos`
--

INSERT INTO `mayoreos` (`id_clm`, `n_pedido`, `Nombre`, `Telefono`, `Total`, `Fecha`, `id_usuario`) VALUES
(2, NULL, 'StudioX', '4271982903', 3600.00, '2026-05-21 14:12:43', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mayoreo_items`
--

CREATE TABLE `mayoreo_items` (
  `id_item` int(11) NOT NULL,
  `id_clm` int(11) NOT NULL,
  `id_prod` int(11) NOT NULL,
  `Ch_cant` int(11) NOT NULL DEFAULT 0,
  `M_cant` int(11) NOT NULL DEFAULT 0,
  `G_cant` int(11) NOT NULL DEFAULT 0,
  `Precio_unit` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mayoreo_items`
--

INSERT INTO `mayoreo_items` (`id_item`, `id_clm`, `id_prod`, `Ch_cant`, `M_cant`, `G_cant`, `Precio_unit`) VALUES
(1, 2, 8, 2, 3, 1, 600.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodos_pgo`
--

CREATE TABLE `metodos_pgo` (
  `id_pago` int(11) NOT NULL,
  `Metodo` varchar(20) NOT NULL,
  `Monto_recibido` decimal(10,2) DEFAULT NULL,
  `Cambio` decimal(10,2) DEFAULT NULL,
  `Tipo_tarjeta` varchar(10) DEFAULT NULL,
  `Terminacion` varchar(4) DEFAULT NULL,
  `Num_trans` varchar(30) DEFAULT NULL,
  `Referencia` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_prod` int(11) NOT NULL,
  `Codigo` varchar(10) NOT NULL,
  `Nombre` varchar(120) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `Stock_ch` int(11) NOT NULL DEFAULT 0,
  `Stock_m` int(11) NOT NULL DEFAULT 0,
  `Stock_g` int(11) NOT NULL DEFAULT 0,
  `Precio` decimal(10,2) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_prod`, `Codigo`, `Nombre`, `Descripcion`, `Stock_ch`, `Stock_m`, `Stock_g`, `Precio`, `id_usuario`) VALUES
(8, '01001', 'Entero Beige', 'Deportivo', 15, 15, 15, 600.00, 5),
(9, '20001', 'Sudadera roja', 'Rojo', 15, 15, 15, 383.00, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `suministros`
--

CREATE TABLE `suministros` (
  `id_sum` int(11) NOT NULL,
  `Nombre` varchar(120) NOT NULL,
  `Tipo` varchar(20) NOT NULL DEFAULT 'limpieza',
  `Cantidad` int(11) NOT NULL,
  `Precio` decimal(10,2) NOT NULL,
  `TotalCosto` decimal(10,2) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `suministros`
--

INSERT INTO `suministros` (`id_sum`, `Nombre`, `Tipo`, `Cantidad`, `Precio`, `TotalCosto`, `Fecha`, `id_usuario`) VALUES
(1, 'Escoba', 'limpieza', 1, 40.00, 40.00, '2026-05-21 13:41:34', NULL),
(3, 'Sudaderea roja', 'reabastecimiento', 45, 1600.00, 72000.00, '2026-05-21 13:50:05', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `Nombre` varchar(80) NOT NULL,
  `Rol` varchar(20) NOT NULL,
  `Telefono` varchar(15) DEFAULT NULL,
  `Contrasena` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `Nombre`, `Rol`, `Telefono`, `Contrasena`) VALUES
(3, 'Alondra', 'Administrador', '4271093867', 'holis1234'),
(4, 'Erick', 'Empleado', '', '1234'),
(5, 'Dany', 'Administrador', '', '1234');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `id_pago` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `Total` decimal(10,2) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `Devuelta` tinyint(1) NOT NULL DEFAULT 0,
  `Origen` varchar(20) NOT NULL DEFAULT 'directo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta_items`
--

CREATE TABLE `venta_items` (
  `id_item` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_prod` int(11) NOT NULL,
  `Talla` varchar(10) NOT NULL,
  `Cantidad` int(11) NOT NULL DEFAULT 1,
  `Precio_unit` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `apartados`
--
ALTER TABLE `apartados`
  ADD PRIMARY KEY (`id_apart`),
  ADD KEY `id_venta` (`id_venta`);

--
-- Indices de la tabla `apartado_items`
--
ALTER TABLE `apartado_items`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `id_apart` (`id_apart`),
  ADD KEY `id_prod` (`id_prod`);

--
-- Indices de la tabla `mayoreos`
--
ALTER TABLE `mayoreos`
  ADD PRIMARY KEY (`id_clm`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `mayoreo_items`
--
ALTER TABLE `mayoreo_items`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `id_clm` (`id_clm`),
  ADD KEY `id_prod` (`id_prod`);

--
-- Indices de la tabla `metodos_pgo`
--
ALTER TABLE `metodos_pgo`
  ADD PRIMARY KEY (`id_pago`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_prod`),
  ADD UNIQUE KEY `Codigo` (`Codigo`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `suministros`
--
ALTER TABLE `suministros`
  ADD PRIMARY KEY (`id_sum`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `Nombre` (`Nombre`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `id_pago` (`id_pago`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `venta_items`
--
ALTER TABLE `venta_items`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_prod` (`id_prod`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `apartados`
--
ALTER TABLE `apartados`
  MODIFY `id_apart` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `apartado_items`
--
ALTER TABLE `apartado_items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `mayoreos`
--
ALTER TABLE `mayoreos`
  MODIFY `id_clm` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `mayoreo_items`
--
ALTER TABLE `mayoreo_items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `metodos_pgo`
--
ALTER TABLE `metodos_pgo`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_prod` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `suministros`
--
ALTER TABLE `suministros`
  MODIFY `id_sum` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `venta_items`
--
ALTER TABLE `venta_items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `apartados`
--
ALTER TABLE `apartados`
  ADD CONSTRAINT `apartados_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`);

--
-- Filtros para la tabla `apartado_items`
--
ALTER TABLE `apartado_items`
  ADD CONSTRAINT `apartado_items_ibfk_1` FOREIGN KEY (`id_apart`) REFERENCES `apartados` (`id_apart`) ON DELETE CASCADE,
  ADD CONSTRAINT `apartado_items_ibfk_2` FOREIGN KEY (`id_prod`) REFERENCES `productos` (`id_prod`);

--
-- Filtros para la tabla `mayoreos`
--
ALTER TABLE `mayoreos`
  ADD CONSTRAINT `mayoreos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `mayoreo_items`
--
ALTER TABLE `mayoreo_items`
  ADD CONSTRAINT `mayoreo_items_ibfk_1` FOREIGN KEY (`id_clm`) REFERENCES `mayoreos` (`id_clm`) ON DELETE CASCADE,
  ADD CONSTRAINT `mayoreo_items_ibfk_2` FOREIGN KEY (`id_prod`) REFERENCES `productos` (`id_prod`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `suministros`
--
ALTER TABLE `suministros`
  ADD CONSTRAINT `suministros_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_pago`) REFERENCES `metodos_pgo` (`id_pago`),
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `venta_items`
--
ALTER TABLE `venta_items`
  ADD CONSTRAINT `venta_items_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE,
  ADD CONSTRAINT `venta_items_ibfk_2` FOREIGN KEY (`id_prod`) REFERENCES `productos` (`id_prod`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
