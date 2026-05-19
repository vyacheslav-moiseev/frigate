<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

$routes->group('api', static function ($routes) {
    $routes->get('inspections', 'Api\InspectionController::index');
    $routes->get('inspections/export', 'Api\InspectionController::export');
    $routes->post('inspections/import', 'Api\InspectionController::import');

    $routes->get('inspections/(:num)', 'Api\InspectionController::show/$1');
    $routes->post('inspections', 'Api\InspectionController::create');
    $routes->put('inspections/(:num)', 'Api\InspectionController::update/$1');
    $routes->delete('inspections/(:num)', 'Api\InspectionController::delete/$1');

    $routes->get('sme', 'Api\SmeController::index');
    $routes->get('smes', 'Api\SmeController::index');

    $routes->post('sme', 'Api\SmeController::create');
    $routes->post('smes', 'Api\SmeController::create');

    $routes->put('sme/(:num)', 'Api\SmeController::update/$1');
    $routes->put('smes/(:num)', 'Api\SmeController::update/$1');
});